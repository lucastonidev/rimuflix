import * as searchService from "../../services/tmdb/search.service.js";

export const searchMedia = async (req, res) => {
  try {
    // 👇 Adicionado saga e saga_type aqui
    const { q, type, page, genres, year, sort, provider, saga, saga_type } =
      req.query;

    const data = await searchService.searchMedia({
      query: q,
      type,
      page,
      genres,
      year,
      sort_by: sort,
      provider,
      saga, // 👈 Passando para o service
      saga_type, // 👈 Passando para o service
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erro na busca:", error);
    return res.status(error.status || 500).json({
      success: false,
      error: "Erro ao realizar busca",
      message: error.message,
    });
  }
};
