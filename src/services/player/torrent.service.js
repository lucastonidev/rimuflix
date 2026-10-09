// src/services/player/torrent.service.js
import { searchAPIBay } from "../torrent/apibay.service.js";
import { searchEZTV } from "../torrent/eztv.service.js";
import { searchTorrentio } from "../torrent/torrentio.service.js"; // 👈 Novo serviço importado
import { getMediaData } from "../tmdb/details.service.js";
import { tmdbGet } from "../tmdb/tmdb.client.js";
import { supabaseAdmin } from "../../config/supabase.js";

// ==========================================
// MÓDULO VIP (TORRENTS DO PAINEL ADMIN)
// ==========================================
async function searchCustomMedia(tmdbId, type, season, episode) {
  try {
    let query = supabase
      .from("custom_media")
      .select("torrent_links, title")
      .eq("tmdb_id", String(tmdbId))
      .eq("media_type", type);

    // Se for série, filtra pela temporada e episódio exatos
    if (type === "tv" && season && episode) {
      query = query.eq("season_number", season).eq("episode_number", episode);
    }

    const { data, error } = await query.single();
    
    // Se não achar nada no painel admin, retorna array vazio para não quebrar
    if (error || !data || !data.torrent_links) return [];

    let links = [];
    
    // Tratamento de segurança caso os links tenham sido salvos como array ou string
    if (Array.isArray(data.torrent_links)) {
      links = data.torrent_links;
    } else if (typeof data.torrent_links === 'string') {
      links = data.torrent_links.split('\n').filter(Boolean);
    }

    // Formata no mesmo padrão das APIs externas para o Frontend não perceber a diferença
    return links.map((torrent, index) => {
      const magnetLink = typeof torrent === 'object' ? torrent.magnet : torrent;
      
      return {
        title: `⭐ ${data.title || "Rimuflix Premium"} - Opção ${index + 1}`,
        quality: "VIP",
        size: "Rápido",
        seeders: 9999, // 👈 O SEGREDO! Isso empurra ele pro topo do array no .sort()
        magnet: magnetLink,
        source: "Rimuflix" // Aparece a tag bonitinha no card
      };
    }).filter(t => t.magnet); // Garante que só retorna se existir um link magnético real
    
  } catch (err) {
    console.error("[Custom Media] Erro ao buscar torrents VIP:", err.message);
    return [];
  }
}

// ==========================================
// SERVIÇO PRINCIPAL (O MAESTRO)
// ==========================================
export async function getTorrentsForMedia(type, tmdbId, season, episode) {
  const tmdbData = await getMediaData(type, tmdbId);
  const mediaTitle =
    tmdbData.original_title ||
    tmdbData.original_name ||
    tmdbData.title ||
    tmdbData.name;

  let searchQuery = mediaTitle;
  if (type === "tv" && season && episode) {
    const s = String(season).padStart(2, "0");
    const e = String(episode).padStart(2, "0");
    searchQuery = `${mediaTitle} s${s}e${e}`;
  }

  console.log(`[Torrent] Buscando por: "${searchQuery}"...`);

  // 1. Busca o IMDB ID (Necessário para EZTV e Torrentio)
  let imdbId = null;
  try {
    const externalIds = await tmdbGet(`/${type}/${tmdbId}/external_ids`);
    imdbId = externalIds.imdb_id;
  } catch (e) {
    console.warn("[Torrent] Falha ao buscar IMDB ID:", e.message);
  }

  // 2. Monta as promessas das buscas que vão rodar em paralelo
  const promises = [
    { name: "RimuflixVIP", promise: searchCustomMedia(tmdbId, type, season, episode) }, // 👈 NOSSA NOVA BUSCA!
    { name: "APIBay", promise: searchAPIBay(searchQuery) },
    { name: "Torrentio", promise: searchTorrentio(imdbId, type, season, episode) }
  ];

  if (type === "tv" && imdbId) {
    promises.push({ name: "EZTV", promise: searchEZTV(imdbId, season, episode) });
  }

  // 3. Roda tudo em paralelo (A que for mais rápida responde primeiro)
  const results = await Promise.allSettled(promises.map((p) => p.promise));

  let allTorrents = [];
  let apisOnline = 0;
  let errosCriticos = [];

  results.forEach((res, index) => {
    const providerName = promises[index].name;

    if (res.status === "fulfilled") {
      apisOnline++; // A API respondeu com sucesso
      if (res.value && res.value.length > 0) {
        allTorrents.push(...res.value);
      }
    } else {
      errosCriticos.push(`${providerName}: ${res.reason.message}`);
      console.warn(`[Torrent Resilience] ❌ ${providerName} CAIU:`, res.reason.message);
    }
  });

  if (apisOnline === 0) {
    throw new Error(
      `CRITICAL: Todas as fontes de torrent estão offline. Detalhes: ${errosCriticos.join(" | ")}`,
    );
  }

  // 4. Remove itens duplicados usando o link magnético
  const uniqueTorrents = Array.from(new Map(allTorrents.map(item => [item.magnet, item])).values());

  // 5. Ordena por Semeadores. O nosso CustomVIP tem 9999, então ele vai reinar no topo absoluto!
  return uniqueTorrents.sort((a, b) => b.seeders - a.seeders);
}
