import { getTorrentsForMedia } from "../../services/player/torrent.service.js";

export const getTorrentForMedia = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { season, episode } = req.query;

    if (!["movie", "tv"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "Tipo de mídia inválido." });
    }

    const torrents = await getTorrentsForMedia(type, id, season, episode);

    return res.status(200).json({
      success: true,
      data: torrents, // Retorna o array de torrents
    });
  } catch (error) {
    console.error("[Torrent Controller] Erro:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao buscar torrent.",
    });
  }
};

export const testTorrentSources = async (req, res) => {
  const status = {
    eztv: { status: "unknown", latency: null },
    bitsearch: { status: "unknown", latency: null },
  };

  // Teste do EZTV
  try {
    const start = Date.now();
    const response = await fetch("https://eztv1.xyz/api/get-torrents?limit=1", {
      signal: AbortSignal.timeout(4000),
    });
    status.eztv = {
      status: response.ok ? "ONLINE" : "ERROR",
      latency: `${Date.now() - start}ms`,
    };
  } catch (e) {
    status.eztv = { status: "OFFLINE", error: e.message };
  }

  // Teste do Bitsearch
  try {
    const start = Date.now();
    const response = await fetch(
      "https://bitsearch.eu/api/v1/search?q=test&limit=1",
      { signal: AbortSignal.timeout(4000) },
    );
    status.bitsearch = {
      status: response.ok ? "ONLINE" : "ERROR",
      latency: `${Date.now() - start}ms`,
    };
  } catch (e) {
    status.bitsearch = { status: "OFFLINE", error: e.message };
  }

  return res.status(200).json({ success: true, sources: status });
};
