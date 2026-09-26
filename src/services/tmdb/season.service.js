import { tmdbGet } from "./tmdb.client.js";

export const QuerySeason = async (id, season) => {
  try {
    const response = await tmdbGet(`/tv/${id}/season/${season}`);
    return response;
  } catch (error) {
    return {
      success: false,
      status: error,
      message: `Erro ao buscar temporada no TMDB: ${error.message}`,
    };
  }
};
