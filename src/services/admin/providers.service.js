import { supabaseAdmin } from "../../config/supabase.js";

export const getProviders = async () => {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("active_providers")
    .eq("id", "global")
    .single();

  // Se o erro for PGRST116 (nenhuma linha encontrada), significa que é a primeira vez rodando, então retornamos um array vazio.
  if (error && error.code !== "PGRST116") throw error;

  return data?.active_providers || [];
};

export const saveProviders = async (providersArray) => {
  // Atualiza ou insere a linha 'global' com a nova lista
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .upsert([{ id: "global", active_providers: providersArray }], {
      onConflict: "id",
    })
    .select();

  if (error) throw new Error(error.message);
  return data;
};
