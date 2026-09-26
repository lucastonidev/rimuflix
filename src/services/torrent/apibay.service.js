const PUBLIC_TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://9.rarbg.com:2810/announce",
  "udp://tracker.openbittorrent.com:80/announce",
  "udp://exodus.desync.com:6969/announce",
];

const TRACKERS_STRING = PUBLIC_TRACKERS.map(
  (tr) => `&tr=${encodeURIComponent(tr)}`,
).join("");

export async function searchAPIBay(query) {
  try {
    const response = await fetch(
      `https://apibay.org/q.php?q=${encodeURIComponent(query)}`,
      {
        signal: AbortSignal.timeout(6000), // Aguarda no máximo 6 segundos
      },
    );

    if (!response.ok) {
      throw new Error(`APIBay HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // O APIBay é peculiar: se ele não acha nada, ele não dá erro,
    // ele retorna um array com um item de id "0".
    // Isso NÃO é uma queda da API, é apenas "nenhum resultado".
    if (!Array.isArray(data) || data[0]?.id === "0") {
      return [];
    }

    return data.map((item) => {
      const magnet = `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}${TRACKERS_STRING}`;
      const sizeGB = (parseInt(item.size) / (1024 * 1024 * 1024)).toFixed(2);

      return {
        title: item.name,
        magnet: magnet,
        seeders: parseInt(item.seeders) || 0,
        leechers: parseInt(item.leechers) || 0,
        size: `${sizeGB} GB`,
        quality: extractQuality(item.name),
        source: "APIBay",
      };
    });
  } catch (error) {
    // Aqui cai se a internet falhou, deu timeout ou o site caiu (fetch failed)
    throw new Error(`APIBay CAIU ou falhou: ${error.message}`);
  }
}

function extractQuality(title) {
  const t = title.toLowerCase();
  if (t.includes("2160p") || t.includes("4k")) return "4K";
  if (t.includes("1080p")) return "1080p";
  if (t.includes("720p")) return "720p";
  return "Auto";
}
