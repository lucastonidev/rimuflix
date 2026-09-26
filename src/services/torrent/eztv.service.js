// src/services/torrent/eztv.service.js

const EZTV_DOMAINS = [
  "https://eztv1.xyz",
  "https://eztv.re",
  "https://eztv.wf",
];

/**
 * Busca torrents de séries na API do EZTV com suporte a espelhos (mirrors)
 */
export async function searchEZTV(imdbId, season = null, episode = null) {
  // O EZTV utiliza o ID numérico do IMDB (sem o 'tt')
  const cleanImdbId = imdbId ? imdbId.replace(/^tt/, "") : null;

  if (!cleanImdbId) {
    throw new Error("[EZTV] IMDB ID é necessário para buscar no EZTV.");
  }

  let lastError = null;

  // Testa cada domínio mirror caso o principal esteja fora do ar
  for (const domain of EZTV_DOMAINS) {
    try {
      const url = `${domain}/api/get-torrents?imdb_id=${cleanImdbId}&limit=100`;
      console.log(`[EZTV Service] Consultando: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s de timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      if (!data.torrents || !Array.isArray(data.torrents)) {
        throw new Error("Formato de resposta inválido do EZTV");
      }

      // Filtra por Temporada e Episódio se fornecidos
      let torrents = data.torrents;

      if (season !== null && episode !== null) {
        const targetSeason = parseInt(season, 10);
        const targetEpisode = parseInt(episode, 10);

        torrents = torrents.filter((item) => {
          const s = parseInt(item.season, 10);
          const e = parseInt(item.episode, 10);
          return s === targetSeason && e === targetEpisode;
        });
      }

      // Mapeia para o formato padrão do Rimuflix
      return torrents.map((t) => ({
        title: t.title || t.filename,
        size: t.size_bytes
          ? `${(t.size_bytes / 1024 / 1024).toFixed(1)} MB`
          : "N/A",
        seeders: parseInt(t.seeds, 10) || 0,
        leechers: parseInt(t.peers, 10) || 0,
        magnet: t.magnet_url,
        id: t.hash || t.id,
        source: "EZTV",
      }));
    } catch (error) {
      console.warn(
        `[EZTV Service] Falha ao acessar ${domain}: ${error.message}`,
      );
      lastError = error;
    }
  }

  throw new Error(
    `EZTV indisponível em todos os domínios (${lastError?.message})`,
  );
}
