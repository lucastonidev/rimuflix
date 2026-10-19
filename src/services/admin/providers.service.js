import { supabaseAdmin } from "../../config/supabase.js";

const SANDBOX_MODES = new Set(["ads", "none", "custom"]);
const SANDBOX_TOKEN_PATTERN = /^[a-z][a-z0-9-]*$/;

export const validateProviders = (providers) => {
  providers.forEach((provider, index) => {
    if (!provider || typeof provider !== "object") {
      throw new Error(`Provedor inválido na posição ${index}.`);
    }

    const mode = provider.sandboxMode || "none";
    const tokens = provider.sandboxTokens || [];

    if (!SANDBOX_MODES.has(mode)) {
      throw new Error(`Modo de sandbox inválido no provedor ${index + 1}.`);
    }

    if (!Array.isArray(tokens) || tokens.some((token) => typeof token !== "string" || !SANDBOX_TOKEN_PATTERN.test(token))) {
      throw new Error(`Tokens de sandbox inválidos no provedor ${index + 1}.`);
    }

    if (tokens.length > 20) {
      throw new Error(`O provedor ${index + 1} possui tokens demais.`);
    }
  });
};

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
