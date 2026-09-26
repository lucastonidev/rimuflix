import * as doramasService from "../../services/tmdb/doramas.service.js";

export const getDoramas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await doramasService.getDoramasList(page);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro ao carregar doramas",
      message: error.message,
    });
  }
};
