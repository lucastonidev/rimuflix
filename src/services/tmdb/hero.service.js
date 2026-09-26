import { tmdbGetResults } from "./tmdb.client.js";

const HERO_SOURCES = [
  "trending/movie/day",
  "movie/now_playing",
  "movie/popular",
  "movie/top_rated",
];

export async function getFeaturedHero() {
  const queryParams = { include_adult: false };

  const [trendingMovies, nowPlaying, popularMovies, topRated] =
    await Promise.all([
      tmdbGetResults(HERO_SOURCES[0], queryParams),
      tmdbGetResults(HERO_SOURCES[1], queryParams),
      tmdbGetResults(HERO_SOURCES[2], queryParams),
      tmdbGetResults(HERO_SOURCES[3], queryParams),
    ]);

  const allItems = [
    ...trendingMovies,
    ...nowPlaying,
    ...popularMovies,
    ...topRated,
  ];

  // Filtro rigoroso: O Hero precisa de backdrop, poster, sinopse e data!
  const validItems = allItems.filter(
    (item) =>
      item.backdrop_path &&
      item.poster_path &&
      item.overview &&
      item.overview.length > 10 &&
      (item.release_date || item.first_air_date),
  );

  if (!validItems.length) {
    throw new Error("Nenhum item válido encontrado para o hero");
  }

  const randomIndex = Math.floor(Math.random() * validItems.length);
  return validItems[randomIndex];
}
