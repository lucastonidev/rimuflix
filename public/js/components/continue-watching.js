import ApiService from "../api.js";
import { getWatchProgressState } from "./watch-progress.js";

export const continueWaching = async () => {
  // Chama a função híbrida (Nuvem se logado, Local se visitante)
  const storageData = await getWatchProgressState();

  if (!storageData || storageData.length === 0) {
    return [];
  }

  try {
    const api = new ApiService();
    // Cria um array de promessas para buscar os detalhes de cada mídia na API do TMDB
    const historyPromises = storageData.map((media) => {
      return api.GetById(media.mediaType || "movie", media.tmdbId);
    });

    const historyResponses = await Promise.all(historyPromises);

    // Mapeia as respostas garantindo que os dados de progresso (temporada/episódio) sejam mantidos
    return historyResponses
      .filter((res) => res.success && res.data) // Pula mídias que deram erro na API
      .map((res, index) => {
        const progressInfo = storageData[index];
        return {
          ...res.data,
          seasonNumber: progressInfo.seasonNumber,
          episodeNumber: progressInfo.episodeNumber,
          timestamp: progressInfo.timestamp,
        };
      });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};
