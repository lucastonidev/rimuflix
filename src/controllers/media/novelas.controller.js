import { getNovelasService } from "../../services/tmdb/novelas.service.js";

export const getNovelas = async (req, res) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page) || 1; // Pega a página da URL ou define 1 como padrão

    const data = await getNovelasService(type, page);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Controller] Erro na busca de novelas:", error);
    return res.status(error.status || 500).json({
      success: false,
      error: "Erro ao realizar busca de novelas",
      message: error.message,
    });
  }
};
