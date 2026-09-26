import { supabase } from "../../config/supabase.js";

export async function getCustomMediaPlayers(
  tmdbId,
  mediaType,
  season = null,
  episode = null,
) {
  try {
    let customPlayers = [];

    // Monta a query dinamicamente
    let query = supabase
      .from("custom_media")
      .select("*")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    // 👇 Filtra especificamente a temporada e episódio se for TV
    if (mediaType === "tv" && season && episode) {
      query = query.eq("season_number", season).eq("episode_number", episode);
    }

    const { data: media, error } = await query.single();

    if (error || !media) {
      return []; // Retorna array vazio se não achar nada no banco
    }

    // Formata links do Drive (Embeds)
    if (media.drive_links && media.drive_links.length > 0) {
      media.drive_links.forEach((link, index) => {
        customPlayers.push({
          type: "Embed",
          title: `[VIP] Drive ${index + 1}`,
          embed: link.url,
          icon: "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_96dp.png",
        });
      });
    }

    // Formata links de Torrent
    if (media.torrent_links && media.torrent_links.length > 0) {
      media.torrent_links.forEach((torrent, index) => {
        customPlayers.push({
          type: "Torrent",
          title: `[VIP] Torrent ${index + 1}`,
          magnet: torrent.magnet,
          icon: '<i class="fa-solid fa-gem"></i>',
        });
      });
    }

    return customPlayers;
  } catch (err) {
    console.error("Erro no mediaDrive.service:", err);
    return [];
  }
}