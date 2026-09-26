import * as customMediaService from "../../services/admin/customMedia.service.js";

export const addMediaController = async (req, res) => {
  try {
    // 👇 Adicionado season_number e episode_number no destructuring
    const {
      tmdb_id,
      media_type,
      title,
      torrent_links,
      drive_links,
      season_number,
      episode_number,
    } = req.body;

    if (!tmdb_id || !media_type) {
      return res.status(400).json({
        success: false,
        error: "Os campos tmdb_id e media_type são obrigatórios.",
      });
    }

    // Repassando todo o corpo da requisição
    const result = await customMediaService.addOrUpdateMedia(req.body);

    return res.status(200).json({
      success: true,
      message: "Mídia adicionada/atualizada com sucesso!",
      data: result,
    });
  } catch (error) {
    console.error("[Admin Media Controller] Erro:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao salvar mídia",
      message: error.message,
    });
  }
};

export const getMediaController = async (req, res) => {
  try {
    const data = await customMediaService.getAllCustomMedia();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
