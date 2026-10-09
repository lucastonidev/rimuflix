import { supabaseAdmin } from "../../config/supabase.js";

export const getPublicSagas = async (req, res) => {
  try {
    const { data: sagas, error } = await supabaseAdmin
      .from("sagas")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    if (sagas == null || sagas.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Nenhuma saga encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: sagas,
    });
  } catch (error) {
    console.error("[Controller] Erro ao buscar sagas no banco:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao carregar a lista de sagas",
      message: error.message,
    });
  }
};
