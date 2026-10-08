// src/services/torrent/torrentio.service.js

export async function searchTorrentio(imdbId, type, season, episode) {
  // O Torrentio depende exclusivamente do IMDB ID
  if (!imdbId) return [];

  const torrentioUrl =
    type === "movie"
      ? `https://torrentio.strem.fun/stream/movie/${imdbId}.json`
      : `https://torrentio.strem.fun/stream/series/${imdbId}:${season}:${episode}.json`;

  try {
    const res = await fetch(torrentioUrl);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.streams) return [];

    return data.streams.map((stream) => {
      const nameStr = stream.name || "";
      const titleStr = stream.title || "";

      // Extrair Resolução (1080p, 4k, 720p)
      const qualityMatch =
        nameStr.match(/(4k|1080p|720p|480p)/i) ||
        titleStr.match(/(4k|1080p|720p|480p)/i);
      const quality = qualityMatch ? qualityMatch[1].toUpperCase() : "Auto";

      // Extrair Seeders (Torrentio usa o emoji 👤)
      const seedMatch = titleStr.match(/👤\s*(\d+)/);
      const seeders = seedMatch ? parseInt(seedMatch[1]) : 0;

      // Extrair Tamanho (Torrentio usa o emoji 💾)
      const sizeMatch = titleStr.match(/💾\s*([\d.]+\s*[M|G]B)/i);
      const size = sizeMatch ? sizeMatch[1] : "--";

      // Limpar o título para remover os emojis e quebras de linha
      const cleanTitle = titleStr.split("\n")[0].replace(/👤.*$/, "").trim();

      // Montar Magnet Link
      const magnet = stream.infoHash
        ? `magnet:?xt=urn:btih:${stream.infoHash}`
        : stream.url;

      return {
        title: cleanTitle || "Torrentio Release",
        quality: quality,
        size: size,
        seeders: seeders,
        magnet: magnet,
        source: "Torrentio",
      };
    });
  } catch (err) {
    console.error("[Torrentio Service] Erro:", err.message);
    return [];
  }
}
