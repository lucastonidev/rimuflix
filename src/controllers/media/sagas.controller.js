import { supabase } from "../../config/supabase.js";

export const getPublicSagas = async (req, res) => {
  try {
    // Busca todas as sagas do Supabase em vez do arquivo local
    const { data: sagas, error } = await supabase
      .from("sagas")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    // Retorna no mesmo formato que o frontend já espera
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
