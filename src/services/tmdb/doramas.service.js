// src/services/doramas.service.js
import { tmdbGet } from "./tmdb.client.js";

export async function getDoramasList(page = 1, limit = 20) {
  // 1. Busca os IDs na API do Superflix
  const response = await fetch(
    "https://superflixapi.pro/lista?category=doramas&type=tmdb&format=json&order=asc",
  );

  if (!response.ok) throw new Error("Erro ao buscar lista no Superflix");
  const list = await response.json(); // Array de IDs ou objetos com ID TMDB

  // 2. Paginação simples dos IDs
  const startIndex = (page - 1) * limit;
  const paginatedIds = list.slice(startIndex, startIndex + limit);

  // 3. Busca os detalhes no TMDB em paralelo para manter o padrão visual do app
  const doramasDetails = await Promise.all(
    paginatedIds.map(async (item) => {
      try {
        const tmdbId =
          typeof item === "object" ? item.id || item.tmdb_id : item;
        const data = await tmdbGet(`/tv/${tmdbId}`);
        return { ...data, media_type: "tv" };
      } catch (err) {
        return null; // Caso não encontre no TMDB
      }
    }),
  );
  
  if (!Array.isArray(list)) {
    return { results: [], total_pages: 0, page };
  }

  return {
    results: doramasDetails.filter(Boolean),
    total_pages: Math.ceil(list.length / limit),
    page,
  };
}
