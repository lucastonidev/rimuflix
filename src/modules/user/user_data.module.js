import { supabase } from "../../config/supabase.js"; // Ajuste o caminho conforme o seu projeto

export const UserDataModule = {
  sanitizeUsername: (text) => {
    if (!text) return "";
    return text.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim();
  },

  // ==========================================
  // FAVORITOS (watchlist)
  // ==========================================
  async getCustomLists(user_id) {
    const { data, error } = await supabase
      .from("custom_lists")
      .select("*")
      .eq("user_id", user_id);

    if (error) return { success: false, error: error.message };

    const grouped = {};

    data.forEach((item) => {
      // 1. Normaliza o nome caso tenha escapado algum espaço acidental no banco
      const exactName = item.list_name.trim();

      if (!grouped[exactName]) {
        // 2. GERAÇÃO ROBUSTA DE ID: Converte o nome para Base64 e remove caracteres que quebram o HTML
        // Isso garante que "Séries-Top" e "Series Top" gerem IDs completamente diferentes e únicos.
        const safeId = Buffer.from(exactName)
          .toString("base64")
          .replace(/[^a-zA-Z0-9]/g, "");

        grouped[exactName] = {
          id: `list-${safeId}`,
          name: exactName,
          items: [],
        };
      }

      grouped[exactName].items.push({
        id: item.tmdb_id,
        type: item.media_type,
      });
    });

    return { success: true, data: Object.values(grouped) };
  },

  async AddWatchlist({ user_id, tmdb_id, media_type }) {
    const { data: existing, error: findError } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user_id)
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type)
      .maybeSingle();

    if (findError)
      return {
        success: false,
        error: findError.message,
        status: findError.code,
      };

    if (!existing) {
      const { error: insertError } = await supabase
        .from("user_favorites")
        .insert([{ user_id, tmdb_id, media_type }]);

      if (insertError)
        return {
          success: false,
          error: insertError.message,
          status: insertError.code,
        };
      return { success: true, action: "added", status: 201 };
    }

    return {
      success: false,
      error: "item já está dentro do banco de dados",
      status: 500,
    };
  },

  async RemoveWatchlist({ user_id, tmdb_id, media_type }) {
    const { data: existing, error: findError } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user_id)
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type)
      .maybeSingle();

    if (findError)
      return { success: false, error: findError.message, status: 404 };

    if (existing) {
      const { status, error: deleteError } = await supabase
        .from("user_favorites")
        .delete()
        .eq("id", existing.id);

      if (deleteError)
        return { success: false, error: deleteError.message, status };
      return { success: true, action: "removed", status };
    } else {
      return { success: false, error: "Não existe mais", status: 404 };
    }
  },

  // ==========================================
  // LISTAS PERSONALIZADAS (custom_lists)
  // ==========================================
  async getCustomLists(user_id) {
    const { data, error } = await supabase
      .from("custom_lists")
      .select("*")
      .eq("user_id", user_id);

    if (error) return { success: false, error: error.message };

    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.list_name]) {
        grouped[item.list_name] = {
          id: `list-${item.list_name.replace(/\s+/g, "-").toLowerCase()}`,
          name: item.list_name,
          items: [],
        };
      }
      grouped[item.list_name].items.push({
        id: item.tmdb_id,
        type: item.media_type,
      });
    });

    return { success: true, data: Object.values(grouped) };
  },

  async toggleCustomList({ user_id, tmdb_id, media_type, list_name }) {
    // 1. PROTEÇÃO DE ENTRADA: Remove espaços nas pontas e impede listas sem nome
    const cleanListName = (list_name || "").trim();

    if (!cleanListName) {
      return { success: false, error: "O nome da lista não pode estar vazio." };
    }

    // 2. PROTEÇÃO DE CRASH: Usamos .limit(1) em vez de .maybeSingle().
    // Se o banco tiver dados duplicados por acidente, ele pega o primeiro sem dar erro fatal.
    const { data: existingArray, error: findError } = await supabase
      .from("custom_lists")
      .select("id")
      .eq("user_id", user_id)
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type)
      .eq("list_name", cleanListName)
      .limit(1);

    if (findError) return { success: false, error: findError.message };

    const existing =
      existingArray && existingArray.length > 0 ? existingArray[0] : null;

    if (existing) {
      // REMOVER FILME DA LISTA
      const { error: deleteError } = await supabase
        .from("custom_lists")
        .delete()
        .eq("id", existing.id); // Deleta especificamente a linha encontrada

      if (deleteError) return { success: false, error: deleteError.message };
      return { success: true, action: "removed" };
    } else {
      // ADICIONAR FILME NA LISTA

      // -> Opcional: Se quiser adicionar um limite Anti-Spam (ex: máximo 20 listas por pessoa)
      // você pode fazer um select.count() aqui antes do insert.

      const { error: insertError } = await supabase
        .from("custom_lists")
        .insert([{ user_id, tmdb_id, media_type, list_name: cleanListName }]);

      if (insertError) return { success: false, error: insertError.message };
      return { success: true, action: "added" };
    }
  },

  // ==========================================
  // PROGRESSO (watch_history)
  // ==========================================
  async getProgress(user_id) {
    const { data, error } = await supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", user_id);

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  async upsertProgress({
    user_id,
    tmdb_id,
    media_type,
    season_number,
    episode_number,
    stopped_at,
  }) {
    // Usando upsert para atualizar ou inserir caso não exista
    const payload = {
      user_id,
      tmdb_id,
      media_type,
      season_number,
      episode_number,
      stopped_at,
    };

    const { data, error } = await supabase
      .from("watch_history")
      .upsert(payload, { onConflict: "user_id, tmdb_id, media_type" })
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  async removeProgress(user_id, tmdb_id, media_type) {
    const { error } = await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", user_id)
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type);

    if (error) return { success: false, error: error.message };
    return { success: true, action: "removed" };
  },

  // ==========================================
  // CONFIGURAÇÕES DE PERFIL
  // ==========================================
  async updateProfile(user_id, { name, email, avatar_url, password }) {
    try {
      // 1. Atualiza a tabela pública (que é a que o site lê)
      const { data, error } = await supabase
        .from("users")
        .update({ name, email, avatar_url })
        .eq("id", user_id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      // 2. Atualiza Auth (E-mail e Senha)
      let authUpdates = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          user_id,
          authUpdates,
        );
        if (authError) {
          // Se der erro na senha (ex: muito curta) ou e-mail já usado, barramos aqui.
          return { success: false, error: authError.message };
        }
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: "Erro interno ao atualizar perfil." };
    }
  },
};
