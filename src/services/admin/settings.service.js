import { supabase } from "../../config/supabase.js";

export const getSettings = async () => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("tmdb_api_key, ads_blocker, default_theme")
    .eq("id", "global")
    .single();

  // Se não encontrar (PGRST116), retornamos as configurações padrão
  if (error && error.code !== "PGRST116") throw new Error(error.message);

  return (
    data || {
      tmdb_api_key: "",
      ads_blocker: true,
      default_theme: "dark",
    }
  );
};

export const updateSettings = async (settingsData) => {
  const { data, error } = await supabase
    .from("app_settings")
    .upsert(
      [
        {
          id: "global",
          tmdb_api_key: settingsData.tmdb_api_key,
          ads_blocker: settingsData.ads_blocker,
          default_theme: settingsData.default_theme,
          updated_at: new Date(),
        },
      ],
      { onConflict: "id" },
    )
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};
