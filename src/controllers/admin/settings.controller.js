import * as settingsService from "../../services/admin/settings.service.js";

export const getSettingsController = async (req, res) => {
  try {
    const data = await settingsService.getSettings();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSettingsController = async (req, res) => {
  try {
    const { tmdb_api_key, ads_blocker, default_theme } = req.body;

    const updatedData = await settingsService.updateSettings({
      tmdb_api_key,
      ads_blocker,
      default_theme,
    });

    return res.status(200).json({
      success: true,
      message: "Configurações atualizadas com sucesso!",
      data: updatedData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
