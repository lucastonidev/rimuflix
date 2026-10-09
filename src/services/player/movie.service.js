import * as clientPlayer from "./player.client.js";
import { getCustomMediaPlayers } from "../database/mediaDrive.service.js";

const buildUrlEmbedPlayer = (url, id, type, title) => {
  let embedUrl = url;

  switch (title) {
    case "MegaEmbed":
      embedUrl = `${url}${id}`;
      break;
    default:
      embedUrl = `${url}filme/${id}`;
  }

  return embedUrl;
};

export const getAllEmbedLink = async (id) => {
  const allPlayers = await clientPlayer.getAllProviders();
  const embedLinks = [];

  allPlayers.map((player) => {
    const embedUrl = buildUrlEmbedPlayer(
      player.embed,
      id,
      player.type,
      player.title,
    );
    embedLinks.push({
      title: player.title,
      embed: embedUrl,
      icon: player.icon,
      type: player.type,
    });
  });

  const customPlayers = await getCustomMediaPlayers(id, "movie");
  if (customPlayers && customPlayers.length > 0) {
    embedLinks.push(...customPlayers);
  }

  return embedLinks;
};
