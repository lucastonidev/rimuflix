// src/services/torrent/bitsearch.service.js

const BITSEARCH_API_URL = "https://bitsearch.eu/api/v1";

/**
 * Busca torrents na API do Bitsearch.
 * @param {string} query - Termo de busca (ex: 'Inception 2010').
 * @param {number} limit - Número de resultados (máx 100)[reference:5].
 * @param {string} sort - Ordenação: 'seeders', 'size', 'date', etc.[reference:6].
 * @param {string} apiKey - (Opcional) Chave da API para mais requisições.
 * @returns {Promise<Object>} - Resultados da busca.
 */
export async function searchTorrents(
  query,
  limit = 5,
  sort = "seeders",
  apiKey = null,
) {
  const url = new URL(`${BITSEARCH_API_URL}/search`);
  url.searchParams.append("q", query);
  url.searchParams.append("limit", Math.min(limit, 100));
  url.searchParams.append("sort", sort);
  url.searchParams.append("order", "desc"); // Mais seeds primeiro

  const headers = {};
  if (apiKey) {
    headers["x-api-key"] = apiKey; // Autenticação opcional[reference:7]
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Erro na API Bitsearch: ${response.status} - ${errorData.message || response.statusText}`,
    );
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(
      `API retornou erro: ${data.message || "Erro desconhecido"}`,
    );
  }

  return data;
}

/**
 * Obtém detalhes de um torrent específico pelo ID ou infohash.
 * @param {string} id - ID ou infohash do torrent[reference:8].
 * @param {string} apiKey - (Opcional) Chave da API.
 * @returns {Promise<Object>} - Detalhes do torrent.
 */
export async function getTorrentDetails(id, apiKey = null) {
  const url = new URL(`${BITSEARCH_API_URL}/torrent/${id}`);
  const headers = {};
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`Erro ao buscar detalhes do torrent: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Erro ao buscar detalhes: ${data.message}`);
  }

  return data.torrent; // Retorna o objeto do torrent diretamente[reference:9]
}
