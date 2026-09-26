// src/controllers/player/torrent.controller.js
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

    // Chama o serviço inteligente
    const torrents = await getTorrentsForMedia(type, id, season, episode);

    // Retorna 200 OK. O Front-end já está preparado para lidar com data vazio (length === 0)
    return res.status(200).json({
      success: true,
      data: torrents,
    });
  } catch (error) {
    // Cai aqui APENAS se TODAS as APIs estiverem offline simultaneamente (Erro Crítico)
    console.error("\n[Torrent Controller] Falha Geral:", error.message);
    return res.status(502).json({
      // 502 Bad Gateway indica que nossos serviços externos caíram
      success: false,
      error: "No momento, nossos provedores de torrent estão offline.",
    });
  }
};
