import { getM3uCatalog } from "../../services/tv/m3u.service.js";

export const getM3uCatalogController = async (req, res) => {
  try {
    const mediaType = req.query.type === "series" ? "series" : "movie";
    const data = await getM3uCatalog({
      mediaType,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search || "",
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error("[M3U Catalog] Erro:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
