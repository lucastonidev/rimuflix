import * as tmdbClient from "./tmdb.client.js";
import NodeCache from "node-cache";

// Configura o cache para durar 24 horas (86400 segundos)
// Como o catálogo de novelas não tem lançamentos diários na mesma velocidade de filmes, 24h é o ideal.
const novelasCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

export const getNovelasService = async (type, page = 1) => {
  try {
    let originCountry = "";

    // Mapeia o tipo para a sigla do país
    if (type === "brasileira" || type === "brasileiras") {
      originCountry = "BR";
    } else if (type === "mexicana" || type === "mexicanas") {
      originCountry = "MX";
    } else {
      const error = new Error(
        "Parâmetro informado inválido. Use 'brasileira' ou 'mexicanas'.",
      );
      error.status = 400;
      throw error;
    }

    // Cria uma chave única para cada país e cada página (ex: novelas_BR_page_1)
    const cacheKey = `novelas_${originCountry}_page_${page}`;

    // 1. Verifica se já está na memória
    const cachedData = novelasCache.get(cacheKey);
    if (cachedData) {
      console.log(
        `🚀 [CACHE] Novelas (${originCountry} - Página ${page}) carregadas da memória.`,
      );
      return cachedData;
    }

    // 2. Se não estiver no cache, faz a requisição à API
    console.log(
      `📡 [API] Buscando novelas no TMDB (${originCountry} - Página ${page})...`,
    );

    const data = await tmdbClient.tmdbGet("/discover/tv", {
      with_genres: 10766, // ID do TMDB para "Soap" (Novelas)
      with_origin_country: originCountry,
      page: page,
      language: "pt-BR",
    });

    // 3. Salva a resposta no cache antes de retornar
    novelasCache.set(cacheKey, data);

    return data;
  } catch (error) {
    console.error(`[Service] Erro ao buscar novelas (${type}):`, error);
    throw error;
  }
};
