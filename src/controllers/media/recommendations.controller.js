import * as ServiceRecomendationsFromId from "../../services/tmdb/recomendations.service.js";

export const getRecommendations = async (req, res) => {
  try {
    const data = await ServiceRecomendationsFromId.ServiceRecomendationsFromId(
      req.params.type,
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      error: "Erro ao buscar recomendações do TMDB",
      message: error.message,
    });
  }
};