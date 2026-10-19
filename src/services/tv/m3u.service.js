import { supabaseAdmin } from "../../config/supabase.js";
import crypto from "node:crypto";

const REQUEST_TIMEOUT_MS = 60000;
const MAX_PLAYLIST_BYTES = 100 * 1024 * 1024;
const MAX_FAILURES = 3;
const IMPORT_BATCH_SIZE = 500;

const parseAttributes = (value) =>
  Object.fromEntries(
    [...value.matchAll(/([A-Za-z0-9-]+)="([^"]*)"/g)].map((match) => [
      match[1].toLowerCase(),
      match[2],
    ]),
  );

const classifyChannel = (url) => {
  const path = url.toLowerCase();
  if (path.includes("/movie/")) return "movie";
  if (path.includes("/series/")) return "series";
  return "live";
};

const parseM3uLine = async (line, state, onChannel) => {
  const normalizedLine = line.trim();
  if (!normalizedLine) return;

  if (!state.hasHeader) {
    if (normalizedLine.toUpperCase() !== "#EXTM3U") {
      throw new Error("O conteúdo informado não é uma playlist M3U válida.");
    }
    state.hasHeader = true;
    return;
  }

  if (normalizedLine.toUpperCase().startsWith("#EXTINF:")) {
    const separator = normalizedLine.indexOf(",");
    const info = separator >= 0 ? normalizedLine.slice(0, separator) : normalizedLine;
    const title = separator >= 0 ? normalizedLine.slice(separator + 1).trim() : "Canal";
    const attributes = parseAttributes(info);
    state.metadata = {
      name: title || attributes["tvg-name"] || "Canal",
      logo_url: attributes["tvg-logo"] || "",
      categoria: attributes["group-title"] || "Outros",
    };
    return;
  }

  if (!normalizedLine.startsWith("#") && state.metadata) {
    if (/^https?:\/\//i.test(normalizedLine)) {
      await onChannel({
        ...state.metadata,
        url: normalizedLine,
        media_type: classifyChannel(normalizedLine),
      });
    }
    state.metadata = null;
  }
};

const parseM3uStream = async (body, onChannel) => {
  const decoder = new TextDecoder();
  const state = { hasHeader: false, metadata: null };
  let pending = "";
  let receivedBytes = 0;

  for await (const chunk of body) {
    receivedBytes += chunk.byteLength;
    if (receivedBytes > MAX_PLAYLIST_BYTES) {
      throw new Error("A playlist excede o tamanho máximo permitido.");
    }

    pending += decoder.decode(chunk, { stream: true });
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || "";
    for (const line of lines) await parseM3uLine(line, state, onChannel);
  }

  pending += decoder.decode();
  if (pending) await parseM3uLine(pending, state, onChannel);

  if (!state.hasHeader) {
    throw new Error("O conteúdo informado não é uma playlist M3U válida.");
  }
};

const fetchPlaylist = async (url, onChannel) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "audio/x-mpegurl, application/vnd.apple.mpegurl, text/plain" },
  });

  if (!response.ok) {
    throw new Error(`A playlist retornou HTTP ${response.status}.`);
  }

  if (!response.body) {
    throw new Error("O servidor não forneceu a playlist em formato de stream.");
  }
  return parseM3uStream(response.body, onChannel);
};

export const parseM3u = async (content) => {
  const channels = [];
  const state = { hasHeader: false, metadata: null };
  for (const line of content.split(/\r?\n/)) {
    await parseM3uLine(line, state, (channel) => channels.push(channel));
  }
  if (!state.hasHeader || channels.length === 0) {
    throw new Error("A playlist M3U não contém canais válidos.");
  }
  return channels;
};

const normalizeUrl = (value) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Informe uma URL válida para a playlist M3U.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("A playlist precisa usar uma URL HTTP ou HTTPS.");
  }
  return parsed.toString();
};

export const createM3uPlaylist = async ({ name, url }) => {
  const normalizedUrl = normalizeUrl(url);
  const { data, error } = await supabaseAdmin
    .from("m3u_playlists")
    .insert({
      name: String(name || "Playlist IPTV").trim().slice(0, 120) || "Playlist IPTV",
      url: normalizedUrl,
      last_checked_at: new Date().toISOString(),
    })
    .select("id, name, url, channels, is_active, last_checked_at")
    .single();

  if (error) throw new Error(error.message);

  try {
    await importM3uPlaylist(data.id, normalizedUrl);
  } catch (importError) {
    await supabaseAdmin.from("m3u_playlists").delete().eq("id", data.id);
    throw importError;
  }

  const { data: imported, error: importedError } = await supabaseAdmin
    .from("m3u_playlists")
    .select("id, name, url, imported_count, import_status, last_checked_at")
    .eq("id", data.id)
    .single();
  if (importedError) throw new Error(importedError.message);
  return imported;
};

const toMediaRow = (playlistId, channel) => ({
  playlist_id: playlistId,
  external_key: crypto.createHash("sha256").update(channel.url).digest("hex"),
  title: channel.name,
  media_type: channel.media_type,
  stream_url: channel.url,
  poster_url: channel.logo_url || null,
  category: channel.categoria || null,
  is_active: true,
  last_seen_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const importM3uPlaylist = async (playlistId, url) => {
  let importedCount = 0;
  let batch = [];
  const syncStartedAt = new Date().toISOString();

  const flush = async () => {
    if (!batch.length) return;
    const { error } = await supabaseAdmin
      .from("m3u_media")
      .upsert(batch, { onConflict: "playlist_id,external_key" });
    if (error) throw new Error(error.message);
    batch = [];
  };

  await supabaseAdmin
    .from("m3u_playlists")
    .update({ import_status: "importing", imported_count: 0 })
    .eq("id", playlistId);

  try {
    await fetchPlaylist(url, async (channel) => {
      const row = toMediaRow(playlistId, channel);
      batch.push(row);
      importedCount += 1;
      if (batch.length >= IMPORT_BATCH_SIZE) await flush();
    });
    await flush();
    if (importedCount === 0) {
      throw new Error("A playlist M3U não contém itens válidos.");
    }

    const { error: staleError } = await supabaseAdmin
      .from("m3u_media")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("playlist_id", playlistId)
      .lt("last_seen_at", syncStartedAt);
    if (staleError) throw new Error(staleError.message);

    const { error } = await supabaseAdmin
      .from("m3u_playlists")
      .update({
        import_status: "ready",
        imported_count: importedCount,
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        failure_count: 0,
      })
      .eq("id", playlistId);
    if (error) throw new Error(error.message);
  } catch (error) {
    await supabaseAdmin
      .from("m3u_playlists")
      .update({ import_status: "failed", last_checked_at: new Date().toISOString() })
      .eq("id", playlistId);
    throw error;
  }

  return importedCount;
};

const checkPlaylist = async (playlist) => {
  try {
    await importM3uPlaylist(playlist.id, playlist.url);
    return playlist;
  } catch (error) {
    const failures = Number(playlist.failure_count || 0) + 1;
    if (failures >= MAX_FAILURES) {
      const { error: deleteError } = await supabaseAdmin
        .from("m3u_playlists")
        .delete()
        .eq("id", playlist.id);
      if (deleteError) throw new Error(deleteError.message);
      return null;
    }

    const { error: updateError } = await supabaseAdmin
      .from("m3u_playlists")
      .update({
        failure_count: failures,
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", playlist.id);
    if (updateError) throw new Error(updateError.message);
    console.warn(`[M3U] Falha ${failures}/${MAX_FAILURES} em ${playlist.url}:`, error.message);
    return { id: playlist.id, name: playlist.name };
  }
};

export const getM3uChannels = async () => {
  const { data, error } = await supabaseAdmin
    .from("m3u_playlists")
    .select("id, name, url, failure_count")
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  await Promise.all((data || []).map(checkPlaylist));
  const { data: channels, error: channelsError } = await supabaseAdmin
    .from("m3u_media")
    .select("id, title, poster_url, category, stream_url, playlist_id")
    .eq("media_type", "live")
    .eq("is_active", true);
  if (channelsError) throw new Error(channelsError.message);
  return (channels || []).map((channel) => ({
    id: `m3u-${channel.id}`,
    name: channel.title,
    logo_url: channel.poster_url || "",
    categoria: channel.category || "TV",
    extractedPlayers: [{ title: "M3U", url: channel.stream_url }],
    epg: [],
  }));
};

export const getM3uPlaylists = async () => {
  const { data, error } = await supabaseAdmin
    .from("m3u_playlists")
    .select("id, name, url, channels, is_active, failure_count, last_checked_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getM3uCatalog = async ({ mediaType, page = 1, limit = 40, search = "" }) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 40));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  let query = supabaseAdmin
    .from("m3u_media")
    .select("id, title, media_type, stream_url, poster_url, category, season_number, episode_number", { count: "exact" })
    .eq("is_active", true)
    .eq("media_type", mediaType)
    .order("title", { ascending: true })
    .range(from, to);
  if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { data: data || [], page: safePage, limit: safeLimit, total: count || 0 };
};

export const getM3uPlayersByTitle = async (title, mediaType, idPoster) => {
  if (!title?.trim()) return [];

  const normalizedTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
  const searchTerm = title.trim().replace(/[%_]/g, "");
  const { data, error } = await supabaseAdmin
    .from("m3u_media")
    .select("id, title, stream_url, poster_url, category")
    .eq("media_type", mediaType === "tv" ? "series" : "movie")
    .eq("is_active", true)
    .ilike("title", `%${searchTerm}%`)
    .limit(20);

  if (error) throw new Error(error.message);

  return (data || [])
    .map((item) => ({
      type: "M3U",
      title: `IPTV No Ads ${item.category.includes("Legendados") ? "Legendado" : "Dublado"}`,
      embed: item.stream_url,
      icon: "http://localhost:3000/img/IPTV.png",
    }))
    .filter((_player, index) => {
      const candidate = (data[index].poster_url).split("/").pop().split(".")[0];
      
      return (candidate === idPoster);
    });
};

export const deleteM3uPlaylist = async (id) => {
  const { error } = await supabaseAdmin.from("m3u_playlists").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
