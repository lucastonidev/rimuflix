import * as providersService from "../../services/admin/providers.service.js";

export const getProvidersController = async (req, res) => {
  try {
    const data = await providersService.getProviders();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const saveProvidersController = async (req, res) => {
  try {
    const { providers } = req.body;

    if (!Array.isArray(providers)) {
      return res
        .status(400)
        .json({ success: false, error: "Formato de provedores inválido." });
    }

    await providersService.saveProviders(providers);

    return res.status(200).json({
      success: true,
      message: "Provedores atualizados com sucesso!",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
