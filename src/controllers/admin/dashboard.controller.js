import { supabaseAdmin } from "../../config/supabase.js"; // 👈 Alterado para supabaseAdmin

export const getDashboardStats = async (req, res) => {
  try {
    // Busca a contagem exata de cada tabela ignorando o RLS
    const { count: mediaCount } = await supabaseAdmin
      .from("custom_media")
      .select("*", { count: "exact", head: true });
    const { count: usersCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });
    const { count: listsCount } = await supabaseAdmin
      .from("custom_lists")
      .select("*", { count: "exact", head: true });
    const { count: reviewsCount } = await supabaseAdmin
      .from("reviews")
      .select("*", { count: "exact", head: true });

    // Busca as últimas 5 mídias adicionadas
    const { data: recentMedia } = await supabaseAdmin
      .from("custom_media")
      .select("tmdb_id, title, media_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          media: mediaCount || 0,
          users: usersCount || 0,
          lists: listsCount || 0,
          reviews: reviewsCount || 0,
        },
        recentMedia: recentMedia || [],
      },
    });
  } catch (error) {
    console.error("[Dashboard Controller] Erro:", error);
    return res
      .status(500)
      .json({ success: false, error: "Erro ao buscar estatísticas" });
  }
};
