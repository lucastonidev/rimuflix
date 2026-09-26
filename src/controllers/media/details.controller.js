import * as QueryFromIdService from "../../services/tmdb/details.service.js";

export const getDetails = async (req, res) => {
  try {
    const data = await QueryFromIdService.getMediaData(
      req.params.type,
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(error.status || 500).json({
      success: false,
      error: "Erro ao buscar dados da mídia",
      message: error.message,
    });
  }
};
