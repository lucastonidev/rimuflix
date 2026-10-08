// src/services/player/torrent.service.js
import { searchAPIBay } from "../torrent/apibay.service.js";
import { searchEZTV } from "../torrent/eztv.service.js";
import { searchTorrentio } from "../torrent/torrentio.service.js"; // 👈 Novo serviço importado
import { getMediaData } from "../tmdb/details.service.js";
import { tmdbGet } from "../tmdb/tmdb.client.js";

export async function getTorrentsForMedia(type, tmdbId, season, episode) {
  const tmdbData = await getMediaData(type, tmdbId);
  const mediaTitle =
    tmdbData.original_title ||
    tmdbData.original_name ||
    tmdbData.title ||
    tmdbData.name;

  let searchQuery = mediaTitle;
  if (type === "tv" && season && episode) {
    const s = String(season).padStart(2, "0");
    const e = String(episode).padStart(2, "0");
    searchQuery = `${mediaTitle} s${s}e${e}`;
  }

  console.log(`[Torrent] Buscando por: "${searchQuery}"...`);

  // 1. Busca o IMDB ID usando a rota external_ids do TMDB (Necessário para EZTV e Torrentio)
  let imdbId = null;
  try {
    const externalIds = await tmdbGet(`/${type}/${tmdbId}/external_ids`);
    imdbId = externalIds.imdb_id;
  } catch (e) {
    console.warn("[Torrent] Falha ao buscar IMDB ID:", e.message);
  }

  // 2. Monta as promessas das buscas que vão rodar em paralelo
  const promises = [
    { name: "APIBay", promise: searchAPIBay(searchQuery) },
    {
      name: "Torrentio",
      promise: searchTorrentio(imdbId, type, season, episode),
    },
  ];

  // O EZTV só busca séries e precisa obrigatoriamente do IMDB ID
  if (type === "tv" && imdbId) {
    promises.push({
      name: "EZTV",
      promise: searchEZTV(imdbId, season, episode),
    });
  }

  // 3. Roda tudo em paralelo sem deixar que o erro de uma API derrube a outra
  const results = await Promise.allSettled(promises.map((p) => p.promise));

  let allTorrents = [];
  let apisOnline = 0;
  let errosCriticos = [];

  results.forEach((res, index) => {
    const providerName = promises[index].name;

    if (res.status === "fulfilled") {
      apisOnline++; // A API respondeu com sucesso
      if (res.value && res.value.length > 0) {
        allTorrents.push(...res.value);
      }
    } else {
      // Falha na API (Timeout, 502, bloqueio)
      errosCriticos.push(`${providerName}: ${res.reason.message}`);
      console.warn(
        `[Torrent Resilience] ❌ ${providerName} CAIU:`,
        res.reason.message,
      );
    }
  });

  // 4. Inteligência: Só consideramos falha catastrófica se TODAS as APIs caírem
  if (apisOnline === 0) {
    throw new Error(
      `CRITICAL: Todas as fontes de torrent estão offline. Detalhes: ${errosCriticos.join(" | ")}`,
    );
  }

  // 5. Remove itens duplicados usando o link magnético e ordena por seeders
  const uniqueTorrents = Array.from(
    new Map(allTorrents.map((item) => [item.magnet, item])).values(),
  );

  return uniqueTorrents.sort((a, b) => b.seeders - a.seeders);
}
