import * as clientPlayer from "./player.client.js";
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
    const providers = await clientPlayer.getAllProviders();

    const activeProviders = providers || [];
    const embedLinks = [];

    providers.map((player) => {
      const embedUrl = buildUrlEmbedPlayerTv(
        player.embed,
        player.title,
        season,
        episode,
        id
      );
      embedLinks.push({
        title: player.title,
        embed: embedUrl,
        icon: player.icon,
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
