import { supabaseAdmin } from "../../config/supabase.js";

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

const getSandboxAttribute = (provider) => {
  if (provider.sandboxMode === "ads") {
    return "allow-scripts allow-same-origin";
  }

  if (provider.sandboxMode === "custom" && Array.isArray(provider.sandboxTokens)) {
    return provider.sandboxTokens.join(" ");
  }

  return "";
};

/**
 * Busca todos os provedores 
 */
export const getAllProviders = async (id) => {
  const { data: appSettings, error } = await supabaseAdmin
    .from("app_settings")
    .select("*");
  if (error) throw error;
  const providers = appSettings?.[0]?.active_providers || [];

  return providers.map((prov) => {
    const hasNoAdsLabel =
      prov.sandboxMode === "ads" &&
      !String(prov.name || "").endsWith("| no Ads");

    return {
      title: hasNoAdsLabel ? `${prov.name} | no Ads` : prov.name,
      icon: getProviderIcon(prov.type, prov.icon),
      embed: prov.url ? formatProviderUrl(prov.url, id) : null,
      type: prov.type,
      sandbox: getSandboxAttribute(prov),
    };
  });
};
