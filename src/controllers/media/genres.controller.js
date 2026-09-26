import * as getAllMovieGenresService from "../../services/tmdb/genres.service.js";

export const getGenres = async (req, res) => {
  try {
    const data = await getAllMovieGenresService.getAllMovieGenresService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar dados da mídia",
      message: error.message,
    });
  }
};