import { supabase } from "../../config/supabase.js";

export const UserDataModule = {
  sanitizeUsername: (text) => {
    if (!text) return "";
    return text.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim();
  },

  // ==========================================
  // FAVORITOS E LISTAS (Legacy)
  // ==========================================
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
    const cleanListName = (list_name || "").trim();

    if (!cleanListName) {
      return { success: false, error: "O nome da lista não pode estar vazio." };
    }

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
      const { error: deleteError } = await supabase
        .from("custom_lists")
        .delete()
        .eq("id", existing.id);

      if (deleteError) return { success: false, error: deleteError.message };
      return { success: true, action: "removed" };
    } else {
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
};
