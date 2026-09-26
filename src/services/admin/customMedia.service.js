// src/services/admin/customMedia.service.js
import { supabase } from "../../config/supabase.js";

export const addOrUpdateMedia = async (mediaData) => {
  const payload = {
    tmdb_id: String(mediaData.tmdb_id),
    media_type: mediaData.media_type,
    title: mediaData.title,
    season_number: mediaData.season_number || null,
    episode_number: mediaData.episode_number || null,
    torrent_links: mediaData.torrent_links || [],
    drive_links: mediaData.drive_links || [],
  };

  let query = supabase
    .from("custom_media")
    .select("id")
    .eq("tmdb_id", payload.tmdb_id)
    .eq("media_type", payload.media_type);

  if (payload.media_type === "tv") {
    query = query
      .eq("season_number", payload.season_number)
      .eq("episode_number", payload.episode_number);
  }

  const { data: existing } = await query.maybeSingle();

  // Se já existir O EXATO EPISÓDIO, injetamos o ID do banco no payload para fazer UPDATE.
  if (existing) {
    payload.id = existing.id;
  }

  // 👇 MUDANÇA AQUI: Colocamos { onConflict: "id" } para forçar o Supabase
  // a usar a coluna 'id' como guia, e não o 'tmdb_id'.
  const { data, error } = await supabase
    .from("custom_media")
    .upsert([payload], { onConflict: "id" })
    .select();

  if (error) {
    throw new Error(`Erro no Supabase: ${error.message}`);
  }

  return data;
};

export const getAllCustomMedia = async () => {
  const { data, error } = await supabase
    .from("custom_media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};