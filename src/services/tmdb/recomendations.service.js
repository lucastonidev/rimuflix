import * as tmdbClient from "./tmdb.client.js";
import NodeCache from "node-cache";

// Configura o cache para durar 24 horas (86400 segundos)
// As recomendações mudam muito raramente, então 24h é perfeito.
const recomendationsCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

export const ServiceRecomendationsFromId = async (type, id) => {
  // Cria uma chave única para cada filme/série (ex: recom_movie_1234)
  const cacheKey = `recom_${type}_${id}`;

  // 1. Verifica se já está na memória
  const cachedData = recomendationsCache.get(cacheKey);
  if (cachedData) {
    console.log(
      `🚀 [CACHE] Recomendações carregadas da memória (${type} ID: ${id}).`,
    );
    return cachedData;
  }

  // 2. Se não estiver no cache, faz a requisição à API
  try {
    console.log(
      `📡 [API] Buscando recomendações no TMDB (${type} ID: ${id})...`,
    );
    const response = await tmdbClient.tmdbGet(
      `/${type}/${id}/recommendations`,
      {
        page: 1,
      },
    );

    // 3. Salva a resposta no cache antes de retornar
    recomendationsCache.set(cacheKey, response);

    return response;
  } catch (error) {
    throw new Error("Erro ao buscar dados do TMDB");
  }
};
