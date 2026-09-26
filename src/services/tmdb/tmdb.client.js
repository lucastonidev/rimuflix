const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_LANGUAGE = "pt-BR";

class TmdbHttpError extends Error {
  constructor(message, status, url, details = null) {
    super(message);
    this.name = "TmdbHttpError";
    this.status = status;
    this.url = url;
    this.details = details;
  }
}

function ensureApiKey() {
  if (!process.env.API_KEY_TMDB) {
    throw new Error("API KEY TMDB não foi configurada no ambiente.");
  }
}

function buildUrl(path, query = {}) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(`${TMDB_BASE_URL}/${normalizedPath}`);

  // 3. LEIA A VARIÁVEL DE AMBIENTE DIRETAMENTE AQUI:
  url.searchParams.set("api_key", process.env.API_KEY_TMDB);

  const hasLanguage =
    Object.prototype.hasOwnProperty.call(query, "language") &&
    query.language !== undefined &&
    query.language !== null;

  if (!hasLanguage) {
    url.searchParams.set("language", DEFAULT_LANGUAGE);
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function parseResponse(response, url) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.status_message
        ? data.status_message
        : `Erro na TMDB: ${response.status}`;

    throw new TmdbHttpError(message, response.status, url.toString(), data);
  }

  return data;
}

export async function tmdbRequest(path, options = {}) {
  ensureApiKey();

  const { method = "GET", query = {}, body = null, headers = {} } = options;

  const url = buildUrl(path, query);

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    body,
  });

  return parseResponse(response, url);
}

export async function tmdbGet(path, query = {}) {
  return tmdbRequest(path, {
    method: "GET",
    query,
  });
}

export async function tmdbGetResults(path, query = {}) {
  const data = await tmdbGet(path, query);
  return Array.isArray(data?.results) ? data.results : [];
}

export function tmdbImage(path, size = "w500") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function isMovieType(type) {
  return type === "movie";
}

export function isTvType(type) {
  return type === "tv";
}

export function assertValidMediaType(type) {
  if (!["movie", "tv"].includes(type)) {
    throw new Error("Tipo de mídia inválido. Use 'movie' ou 'tv'.");
  }
}

export async function submitRating(mediaType, tmdbId, rating, guestSessionId) {
  const TMDB_API_KEY = process.env.API_KEY_TMDB;
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/rating?api_key=${TMDB_API_KEY}&guest_session_id=${guestSessionId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    // O TMDB espera receber um JSON no formato { "value": 8.5 }
    body: JSON.stringify({ value: rating }),
  });

  if (!response.ok) {
    throw new Error("Falha ao comunicar com o TMDB para enviar a avaliação.");
  }

  return await response.json();
}

export { TmdbHttpError, TMDB_BASE_URL, DEFAULT_LANGUAGE };
