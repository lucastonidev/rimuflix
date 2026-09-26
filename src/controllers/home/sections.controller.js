import { getHomeSections } from "../../services/home/home-sections.service.js";

export async function HomeSections(req, res) {
  try {
    const data = await getHomeSections();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || "Erro ao buscar seções da home",
    });
  }
}
