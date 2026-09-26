import * as tmdbClient from "./tmdb.client.js";

function assertValidMediaType(type) {
  if (!["movie", "tv"].includes(type)) {
    const error = new Error("Tipo de mídia inválido. Use 'movie' ou 'tv'.");
    error.status = 400;
    throw error;
  }
}

export const getMediaData = async (type, id) => {
  try {
    // assertValidMediaType(type);

    const data = await tmdbClient.tmdbGet(`/${type}/${id}`);
    return data;
  } catch (error) {
    console.error("Erro real em getMediaData:", error.message, error.status);
    const err = new Error(`Erro ao buscar dados da mídia: ${error.message}`);
    err.status = error.status || 500;
    throw err;
  }
};
