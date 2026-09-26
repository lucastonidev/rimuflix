import { GetCategoriesLiveTvService } from "../../services/tv/categories.service.js";

export async function getCategories(req, res) {
  try {
    const data = await GetCategoriesLiveTvService();
    return res.status(200).json({ 
      success: true, 
      data 
    });
    
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false, // Adicionado aqui também para manter o padrão
      error: error.message || "Erro ao buscar as categorias",
    });
  }
}
