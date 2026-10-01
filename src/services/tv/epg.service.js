import { getLiveTvChannelsService } from "./livetv.service.js";

const normalizeName = (name) => {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const getEpgForChannel = async (channelName) => {
  try {
    const channels = await getLiveTvChannelsService();
    const normTarget = normalizeName(channelName);
    const matchedChannel = channels.find(
      (c) => normalizeName(c.name) === normTarget,
    );

    if (matchedChannel && matchedChannel.epg && matchedChannel.epg.length > 0) {
      return matchedChannel.epg;
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar EPG na lista cacheada:", error);
    return [];
  }
};
