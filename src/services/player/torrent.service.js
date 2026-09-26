// src/services/torrent/torrent.service.js
import { searchTorrents as searchBitsearch } from "../torrent/bitsearch.service.js";
import { searchEZTV } from "../torrent/eztv.service.js";
import { tmdbGet } from "../tmdb/tmdb.client.js";

const pad = (num) => String(num).padStart(2, "0");

/**
 * Busca os detalhes do TMDB incluindo os External IDs (IMDB ID)
 */
async function getMediaWithExternalIds(type, id) {
  const media = await tmdbGet(`/${type}/${id}`);
  const externalIds = await tmdbGet(`/${type}/${id}/external_ids`).catch(
    () => ({}),
  );

  return {
    ...media,
    imdb_id: externalIds.imdb_id || media.imdb_id,
  };
}

/**
 * Busca torrents com fallback dinâmico entre provedores
 */
export async function getTorrentsForMedia(
  type,
  id,
  season = null,
  episode = null,
) {
  const media = await getMediaWithExternalIds(type, id);
  if (!media) throw new Error("Mídia não encontrada no TMDB");

  const title = media.title || media.name;
  const imdbId = media.imdb_id;
  const year = (media.release_date || media.first_air_date || "").split("-")[0];

  const providers = [];

  if (type === "tv" && imdbId) {
    providers.push({
      name: "EZTV",
      fetch: () => searchEZTV(imdbId, season, episode),
    });
  }

  providers.push({
    name: "Bitsearch",
    fetch: async () => {
      let query = title;
      if (type === "tv" && season && episode) {
        query = `${title} S${pad(season)}E${pad(episode)}`;
      } else if (year) {
        query = `${title} ${year}`;
      }

      const res = await searchBitsearch(query, 10, "seeders");
      if (!res?.results?.length) return [];

      return res.results.map((t) => ({
        title: t.title,
        size: t.size,
        seeders: t.seeders || 0,
        leechers: t.leechers || 0,
        magnet: t.magnet || `magnet:?xt=urn:btih:${t.infohash}`,
        id: t.id || t.infohash,
        source: "Bitsearch",
      }));
    },
  });

  let accumulatedTorrents = [];

  for (const provider of providers) {
    console.log(`[Torrent Resilience] Testando provedor: ${provider.name}...`);
    try {
      const results = await provider.fetch();
      if (results && results.length > 0) {
        console.log(
          `[Torrent Resilience] ✅ Sucesso no ${provider.name} (${results.length} resultados)`,
        );
        accumulatedTorrents.push(...results);
        break;
      }
      console.warn(
        `[Torrent Resilience] ⚠️ ${provider.name} respondeu, mas sem resultados.`,
      );
    } catch (err) {
      console.error(
        `[Torrent Resilience] ❌ ${provider.name} CAIU ou falhou: ${err.message}. Tentando próxima fonte...`,
      );
    }
  }

  if (accumulatedTorrents.length === 0) {
    throw new Error(
      "Todas as fontes de torrent (EZTV, Bitsearch) falharam ou não encontraram o arquivo.",
    );
  }

  return accumulatedTorrents.sort((a, b) => b.seeders - a.seeders);
}