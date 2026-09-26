import { supabase } from "../../config/supabase.js";

export const addSagaController = async (req, res) => {
  try {
    const { id, name, type, image } = req.body;

    if (!id || !name || !type) {
      return res
        .status(400)
        .json({ success: false, error: "ID, Nome e Tipo são obrigatórios." });
    }

    const { data, error } = await supabase
      .from("sagas")
      .upsert([{ id, name, type, image }], { onConflict: "id" })
      .select();

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
    const { error } = await supabase.from("sagas").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return res
      .status(200)
      .json({ success: true, message: "Saga removida com sucesso!" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
