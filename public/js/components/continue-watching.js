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

    // 1. Mapeia PRIMEIRO para manter o 'index' sincronizado com o 'storageData'
    // 2. Filtra DEPOIS para remover os nulos que falharam na API
    return historyResponses
      .map((res, index) => {
        // Se a API falhou para esta mídia específica, retorna null
        if (!res.success || !res.data) return null;

        const progressInfo = storageData[index];
        return {
          ...res.data,
          seasonNumber: progressInfo.seasonNumber,
          episodeNumber: progressInfo.episodeNumber,
          timestamp: progressInfo.timestamp,
          stoppedAt: progressInfo.stoppedAt, // Garante o tempo exato repassado
        };
      })
      .filter((item) => item !== null);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};
