import { supabase } from "../../config/supabase.js";

/**
 * Função auxiliar privada para trocar as variáveis nas URLs dos provedores
 */
const formatProviderUrl = (url, id, season = "", episode = "") => {
  if (!url) return "";
  return url
    .replace(/{id}/g, id)
    .replace(/{tmdb_id}/g, id)
    .replace(/{season}/g, season)
    .replace(/{episode}/g, episode);
};

/**
 * Formata o ícone baseado no tipo do provedor
 */
const getProviderIcon = (type, icon) => {
  if (type === "Torrent") {
    return '<i class="fa-solid fa-magnet"></i>';
  }
  return icon;
};

/**
 * Busca e formata os provedores para Filmes
 */
export const getMovieProviders = async (id) => {
  const { data: appSettings, error } = await supabase
    .from("app_settings")
    .select("*");
 const providers = appSettings[0]["active_providers"];

  if (error) throw error;

  return providers.map((prov) => ({
    title: prov.name,
    icon: getProviderIcon(prov.type, prov.icon),
    embed: prov.url ? formatProviderUrl(prov.url, id) : null,
    type: prov.type,
  }));
};

/**
 * Busca e formata os provedores para Séries (TV)
 */
export const getTvProviders = async (id, season, episode) => {
  const { data: providers, error } = await supabase
    .from("providers")
    .select("*");

  if (error) throw error;

  return providers.map((prov) => ({
    title: prov.name,
    icon: getProviderIcon(prov.type, prov.icon),
    embed: prov.url ? formatProviderUrl(prov.url, id, season, episode) : null,
    type: prov.type,
  }));
};
