import { supabaseAdmin } from "../../config/supabase.js";


export const addMedia = async (data) => {
  const { data: result, error } = await supabaseAdmin
    .from("custom_media")
    .insert([data])
    .select();

  if (error) throw new Error(error.message);
  return result[0];
};

// 👇 2. Atualizar Mídia Existente (PUT)
export const updateMedia = async (id, data) => {
  const { data: result, error } = await supabaseAdmin
    .from("custom_media")
    .update(data)
    .eq("id", id)
    .select();

  if (error) throw new Error(error.message);
  return result[0];
};

// 👇 3. Listar Mídias (GET)
export const getAllCustomMedia = async () => {
  const { data, error } = await supabaseAdmin
    .from("custom_media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 👇 4. Excluir Mídia (DELETE)
export const deleteCustomMedia = async (id) => {
  const { error } = await supabaseAdmin
    .from("custom_media")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
};
