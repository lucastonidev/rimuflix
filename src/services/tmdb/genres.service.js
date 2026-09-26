import { tmdbGet } from "./tmdb.client.js";

let genresCache = null;
let genresCacheTime = 0;
const ONE_DAY = 24 * 60 * 60 * 1000;

export async function getAllMovieGenresService() {
  const now = Date.now();

  if (genresCache && now - genresCacheTime < ONE_DAY) {
    return genresCache;
  }

  const data = await tmdbGet("genre/movie/list");

  genresCache = data;
  genresCacheTime = now;

  return data;
}