import * as customMediaService from "../../services/admin/customMedia.service.js";

// 1. CRIAR MÍDIA (POST)
export const addMediaController = async (req, res) => {
  try {
    const { tmdb_id, media_type } = req.body;

    if (!tmdb_id || !media_type) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Os campos tmdb_id e media_type são obrigatórios.",
        });
    }

    const result = await customMediaService.addMedia(req.body);

    return res.status(201).json({
      success: true,
      message: "Mídia adicionada com sucesso!",
      data: result,
    });
  } catch (error) {
    console.error("[Admin Media Controller - Create] Erro:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: "Erro ao salvar mídia",
        message: error.message,
      });
  }
};

// 2. ATUALIZAR MÍDIA (PUT)
export const updateMediaController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "ID da mídia não fornecido." });
    }

    const result = await customMediaService.updateMedia(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Mídia atualizada com sucesso!",
      data: result,
    });
  } catch (error) {
    console.error("[Admin Media Controller - Update] Erro:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: "Erro ao atualizar mídia",
        message: error.message,
      });
  }
};

// 3. LISTAR MÍDIAS (GET)
export const getMediaController = async (req, res) => {
  try {
    const data = await customMediaService.getAllCustomMedia();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. EXCLUIR MÍDIA (DELETE)
export const deleteMediaController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "ID da mídia não fornecido." });
    }

    await customMediaService.deleteCustomMedia(id);

    return res
      .status(200)
      .json({ success: true, message: "Mídia excluída com sucesso!" });
  } catch (error) {
    console.error("[Admin Media Controller - Delete] Erro:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: "Erro ao excluir mídia",
        message: error.message,
      });
  }
};
