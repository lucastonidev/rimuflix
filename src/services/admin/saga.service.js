import { supabaseAdmin } from "../../config/supabase.js";

export const addSagaService = async (id, name, type, image) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("sagas")
      .upsert([{ id, name, type, image }], { onConflict: "id" })
      .select();

    if (error) throw new Error(error.message);
  
    console.log(data, error);
    

    return { success: true, message: "Saga salva com sucesso!", data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSagaService = async () => {
  try {
    const { data: sagas, error } = await supabaseAdmin
      .from("sagas")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

      if (sagas == null || sagas.length === 0) {
        return { success: false, error: "Nenhuma saga encontrada."};
      }

    return { success: true, message: "Sagas encontradas com sucesso!", data: sagas };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSagaService = async (id) => {
  try {
    const { data, error } = await supabaseAdmin.from("sagas").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return { success: true, message: "Saga removida com sucesso!", data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
