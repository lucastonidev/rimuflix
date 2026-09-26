import * as getTvPlayerLinksService from "../../services/player/tv.service.js";

export const GetTvPlayerLinks = async (req, res) => {
  try {
    const data = await getTvPlayerLinksService.getAllEmbedLink(
      req.params.id,
      req.params.season,
      req.params.episode
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
