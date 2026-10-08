import { searchAPIBay } from "../torrent/apibay.service.js";
import { searchEZTV } from "../torrent/eztv.service.js";
import { getMediaData } from "../tmdb/details.service.js";

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

  // 2. Monta as buscas que vão rodar (EZTV só se for série)
  const promises = [{ name: "APIBay", promise: searchAPIBay(searchQuery) }];

  if (type === "tv") {
    promises.push({ name: "EZTV", promise: searchEZTV(searchQuery) });
  }
 

  // 3. Roda tudo em paralelo sem deixar que uma derrube a outra
  const results = await Promise.allSettled(promises.map((p) => p.promise));

  let allTorrents = [];
  let apisOnline = 0;
  let errosCriticos = [];

  results.forEach((res, index) => {
    const providerName = promises[index].name;

    if (res.status === "fulfilled") {
      apisOnline++; // A API respondeu com sucesso (seja com torrents ou vazia)
      if (res.value.length > 0) {
        allTorrents.push(...res.value);
      }
    } else {
      // A API deu erro feio (fetch failed, timeout)
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

  return allTorrents.sort((a, b) => b.seeders - a.seeders);
}
