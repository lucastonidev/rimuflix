import * as ServiceQuerySeasonFromTv from "../../services/tmdb/season.service.js";

export const getSeason = async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await ServiceQuerySeasonFromTv.QuerySeason(id, seasonNumber);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar os dados da temporada no TMDB",
      message: error.message,
    });
  }
};
