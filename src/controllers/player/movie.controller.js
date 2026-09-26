import * as GetMoviePlayerLinksService from "../../services/player/movie.service.js";

export const GetMoviePlayerLinks = async (req, res) => {
  try {
    const data = await GetMoviePlayerLinksService.getAllEmbedLink(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      error: "Erro ao buscar dados da mídia",
      message: error.message,
    });
  }
};
