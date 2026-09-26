import { getLiveTvChannelsService } from "../../services/tv/livetv.service.js";

export const getLiveTvChannels = async (req, res) => {
  try {
    const data = await getLiveTvChannelsService();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[LiveTV Controller] Erro:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar canais",
      message: error.message,
    });
  }
};
