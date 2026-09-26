import { tmdbGet } from "./tmdb.client.js";

export const searchMedia = async (params) => {
  const {
    query,
    type = "all",
    page = 1,
    genres,
    year,
    sort_by,
    provider,
    saga,
    saga_type = "collection",
  } = params;

  // 🌟 MÁGICA DAS SAGAS
  if (saga && saga_type === "list") {
    try {
      // O tmdbClient já deve cuidar da baseURL e da api_key
      const response = await tmdbGet(`/list/${saga}`, {
        params: {
          language: "pt-BR",
          page: page || 1,
        },
      });

      // Se o seu tmdbClient usar Axios, os dados estarão em response.data
      // Se for um wrapper customizado com fetch, pode ser direto o response
      const data = response.data || response;

      return {
        page: page || 1,
        results: data.items || [], // Transformando 'items' em 'results' para o frontend
        total_pages: Math.ceil((data.item_count || 0) / 20),
        total_results: data.item_count || 0,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.status_message ||
        error.message ||
        "Erro ao buscar lista no TMDB";
      throw new Error(errorMessage);
    }
  }

  let response;

  if (query) {
    let endpoint = "/search/multi";
    if (type === "movie") endpoint = "/search/movie";
    if (type === "tv") endpoint = "/search/tv";

    // Adicionado include_adult: false para evitar pornografia/conteúdo adulto
    response = await tmdbGet(endpoint, {
      query,
      page,
      language: "pt-BR",
      include_adult: false,
    });
  } else {
    if (
      type === "all" &&
      !genres &&
      !year &&
      !provider &&
      (!sort_by || sort_by === "popularity.desc")
    ) {
      // Adicionado include_adult: false
      response = await tmdbGet("/trending/all/day", {
        page,
        language: "pt-BR",
        include_adult: false,
      });
    } else {
      let endpoint = type === "tv" ? "/discover/tv" : "/discover/movie";

      const discoverParams = {
        page,
        language: "pt-BR",
        sort_by: sort_by || "popularity.desc",
        include_adult: false, // Bloqueia conteúdo adulto
      };

      if (genres) discoverParams.with_genres = genres;

      if (provider) {
        discoverParams.with_watch_providers = provider;
        discoverParams.watch_region = "BR";
      }

      if (year) {
        if (type === "tv") {
          discoverParams.first_air_date_year = year;
        } else {
          discoverParams.primary_release_year = year;
        }
      }

      response = await tmdbGet(endpoint, discoverParams);
    }
  }

  // Intercepta a resposta e limpa todos os itens sem poster antes de devolver para o front-end
  if (response && response.results) {
    response.results = response.results.filter((item) => item.poster_path);
  }

  return response;
};
