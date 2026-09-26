import * as HeroPopularMovieService from "../../services/tmdb/hero.service.js"

export const getFeaturedHero = async (req, res) => {
  try {
    const data = await HeroPopularMovieService.getFeaturedHero();

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