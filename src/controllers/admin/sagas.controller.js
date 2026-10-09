import * as sagaService from "../../services/admin/saga.service.js";

export const getSagaController = async (req, res) => {
  try {
    const result = await sagaService.getSagaService();

    if (result.success === false) throw new Error(result.error);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const addSagaController = async (req, res) => {
  try {
    const { id, name, type, image } = req.body;

    if (!id || !name || !type) {
      return res
        .status(400)
        .json({ success: false, error: "ID, Nome e Tipo são obrigatórios." });
    }

    const { data, error } = await sagaService.addSagaService(id, name, type, image);

    if (error) throw new Error(error.message);

    return res
      .status(200)
      .json({
        success: true,
        message: "Saga salva com sucesso!",
        data: data[0],
      });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSagaController = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await sagaService.deleteSagaService(id);

    if (error) throw new Error(error.message);

    return res
      .status(200)
      .json({ success: true, message: "Saga removida com sucesso!", data: data[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
