import { getEpgForChannel } from "../../services/tv/epg.service.js";

export const getEpgSchedule = async (req, res) => {
  try {
    const channelName = req.query.channel;
    if (!channelName) {
      return res
        .status(400)
        .json({ success: false, error: "Nome do canal obrigatório" });
    }

    const data = await getEpgForChannel(channelName);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Erro ao buscar programação" });
  }
};
