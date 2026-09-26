import { tmdbGet } from "../tmdb/tmdb.client.js";
import { getDoramasList } from "../tmdb/doramas.service.js";
import NodeCache from "node-cache";

const homeCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Faltou isso aqui:
const HOME_SECTIONS = [
  {
    key: "now_playing",
    title: "Em cartaz",
    path: "movie/now_playing",
    type: "movie",
  },
  {
    key: "popular_movies",
    title: "Mais Popular",
    path: "movie/popular",
    type: "movie",
  },
  {
    key: "top_rated_movies",
    title: "Mais bem avaliado",
    path: "movie/top_rated",
    type: "movie",
  },
  {
    key: "upcoming_movies",
    title: "Em Destaque",
    path: "movie/upcoming",
    type: "movie",
  },
  {
    key: "airing_today",
    title: "Exibido hoje",
    path: "tv/airing_today",
    type: "tv",
  },
  { key: "on_the_air", title: "No ar", path: "tv/on_the_air", type: "tv" },
  { key: "popular_tv", title: "Popular", path: "tv/popular", type: "tv" },
  {
    key: "top_rated_tv",
    title: "Mais bem avaliado",
    path: "tv/top_rated",
    type: "tv",
  },
  {
    key: "doramas",
    title: "Doramas",
    type: "tv",
    customFetch: async () => {
      const data = await getDoramasList(1, 20);
      return data;
    },
  },
];

export async function getHomeSections() {
  const cacheKey = "home_sections_payload";

  // 1. TENTA BUSCAR DO CACHE
  const cachedData = homeCache.get(cacheKey);

  if (cachedData) {
    console.log(
      "🚀 [CACHE] Servindo seções da Home instantaneamente da memória.",
    );
    return cachedData;
  }

  // 2. SE NÃO TIVER NO CACHE, BUSCA NAS APIS
  console.log("📡 [API] Buscando seções da Home no TMDB e Superflix...");

  const responses = await Promise.all(
    HOME_SECTIONS.map(async (section) => {
      let data = null;

      if (section.customFetch) {
        try {
          data = await section.customFetch();
        } catch (error) {
          console.error(
            `Erro ao buscar seção customizada [${section.key}]:`,
            error,
          );
          data = { results: [] };
        }
      } else {
        // Bloqueia conteúdo adulto diretamente na chamada
        data = await tmdbGet(section.path, { include_adult: false });
      }

      // Filtra os itens vazios, sem capa, sem data ou sem descrição
      const validItems = Array.isArray(data?.results)
        ? data.results.filter(
            (item) =>
              item.poster_path &&
              item.overview &&
              (item.release_date || item.first_air_date),
          )
        : [];

      return {
        key: section.key,
        title: section.title,
        type: section.type,
        items: validItems,
      };
    }),
  );

  const finalPayload = { sections: responses };

  // 3. SALVA O RESULTADO NO CACHE PARA OS PRÓXIMOS USUÁRIOS
  homeCache.set(cacheKey, finalPayload);

  return finalPayload;
}
