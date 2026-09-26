import { supabase } from '../../config/supabase.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Busca a contagem exata de cada tabela
    const { count: mediaCount } = await supabase.from('custom_media').select('*', { count: 'exact', head: true });
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: listsCount } = await supabase.from('custom_lists').select('*', { count: 'exact', head: true });
    const { count: reviewsCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });

    // Busca as últimas 5 mídias adicionadas
    const { data: recentMedia } = await supabase
      .from('custom_media')
      .select('tmdb_id, title, media_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          media: mediaCount || 0,
          users: usersCount || 0,
          lists: listsCount || 0,
          reviews: reviewsCount || 0
        },
        recentMedia: recentMedia || []
      }
    });

  } catch (error) {
    console.error("[Dashboard Controller] Erro:", error);
    return res.status(500).json({ success: false, error: "Erro ao buscar estatísticas" });
  }
};