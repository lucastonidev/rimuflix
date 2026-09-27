import { supabase } from "../../config/supabase.js";

// 👇 1. Criar Nova Mídia (POST)
export const addMedia = async (data) => {
  const { data: result, error } = await supabase
    .from("custom_media")
    .insert([data])
    .select();

  if (error) throw new Error(error.message);
  return result[0];
};

// 👇 2. Atualizar Mídia Existente (PUT)
export const updateMedia = async (id, data) => {
  const { data: result, error } = await supabase
    .from("custom_media")
    .update(data)
    .eq("id", id)
    .select();

  if (error) throw new Error(error.message);
  return result[0];
};

// 👇 3. Listar Mídias (GET)
export const getAllCustomMedia = async () => {
  const { data, error } = await supabase
    .from("custom_media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 👇 4. Excluir Mídia (DELETE)
export const deleteCustomMedia = async (id) => {
  const { error } = await supabase.from("custom_media").delete().eq("id", id);

  if (error) throw new Error(error.message);
  return true;
};
