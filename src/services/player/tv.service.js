import { supabase } from "../../config/supabase.js";
import { getCustomMediaPlayers } from "../database/mediaDrive.service.js";

const buildUrlEmbedPlayerTv = (url, title, season, episode, id) => {
  if (!url) return "";

  if (url.includes("{id}") || url.includes("{season}")) {
    return url
      .replace(/{id}/g, id)
      .replace(/{tmdb_id}/g, id)
      .replace(/{season}/g, season)
      .replace(/{episode}/g, episode);
  }

  let embedUrl;

  if (season && episode) {
    switch (title) {
      case "MegaEmbed":
        embedUrl = `${url}${id}/${season}/${episode}`;
        break;
      default:
        embedUrl = `${url}serie/${id}/${season}/${episode}`;
    }
  } else {
    switch (title) {
      case "MegaEmbed":
        embedUrl = `${url}${id}`;
        break;
      default:
        embedUrl = `${url}serie/${id}`;
    }
  }

  return embedUrl;
};

export const getAllEmbedLink = async (id, season, episode) => {
  try {
    const { data: appSettings, error } = await supabase
      .from("app_settings")
      .select("active_providers")
      .eq("id", "global")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const activeProviders = appSettings?.active_providers || [];
    const embedLinks = [];

    activeProviders.forEach((player) => {
      const baseUrl = player.url || player.embed || "";

      embedLinks.push({
        title: player.name || player.title,
        embed: buildUrlEmbedPlayerTv(baseUrl, player.name, season, episode, id),
        icon:
          player.type === "Torrent"
            ? '<i class="fa-solid fa-magnet"></i>'
            : player.icon || '<i class="fa-solid fa-play"></i>',
        type: player.type,
      });
    });

    // 👇 AGORA ENVIAMOS SEASON E EPISODE PARA BUSCAR O ARQUIVO CORRETO!
    const customPlayers = await getCustomMediaPlayers(
      id,
      "tv",
      season,
      episode,
    );

    if (customPlayers && customPlayers.length > 0) {
      embedLinks.push(...customPlayers);
    }

    return embedLinks;
  } catch (error) {
    console.error("Erro ao buscar players de TV:", error);
    return [];
  }
};
