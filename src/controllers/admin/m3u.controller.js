import {
  createM3uPlaylist,
  deleteM3uPlaylist,
  getM3uPlaylists,
} from "../../services/tv/m3u.service.js";

export const addM3uPlaylist = async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "A URL da playlist é obrigatória." });
    }
    const data = await createM3uPlaylist({ name, url });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("[Admin M3U] Erro ao adicionar playlist:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const listM3uPlaylists = async (_req, res) => {
  try {
    return res.json({ success: true, data: await getM3uPlaylists() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const removeM3uPlaylist = async (req, res) => {
  try {
    await deleteM3uPlaylist(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
