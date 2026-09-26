import { supabase } from "../../config/supabase.js";

export const ReviewModule = {
  // ==========================================
  // AVALIAÇÃO INTERNA (Comunidade Rimuflix)
  // ==========================================
  async saveInternalReview({ tmdb_id, media_type, rating, comment, user_id }) {
    try {
      // Insere os dados na tabela 'reviews' do Supabase
      const { data, error } = await supabase.from("reviews").insert([
        {
          tmdb_id,
          media_type,
          rating,
          comment,
          user_id,
        },
      ]);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Erro ao salvar avaliação interna:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // AVALIAÇÃO EXTERNA (Servidor TMDB)
  // ==========================================
  async sendToTmdb({ tmdb_id, media_type, rating }) {
    try {
      // 1. O TMDB exige uma "Guest Session" para enviar notas anonimamente
      const sessionUrl = `https://api.themoviedb.org/3/authentication/guest_session/new?api_key=${process.env.API_KEY_TMDB}`;
      const sessionRes = await fetch(sessionUrl);
      const sessionData = await sessionRes.json();

      if (!sessionData.success)
        throw new Error("Falha ao criar sessão no TMDB");

      const guestSessionId = sessionData.guest_session_id;

      // 2. O TMDB aceita notas de 0.5 a 10.0. O seu frontend envia de 1 a 5.
      // Precisamos multiplicar por 2 para adaptar ao formato do TMDB.
      const tmdbRating = rating * 2;

      // 3. Envia a nota para o filme ou série específico
      const rateUrl = `https://api.themoviedb.org/3/${media_type}/${tmdb_id}/rating?api_key=${process.env.API_KEY_TMDB}&guest_session_id=${guestSessionId}`;

      const rateRes = await fetch(rateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({ value: tmdbRating }),
      });

      const rateData = await rateRes.json();

      if (rateData.success) {
        return { success: true, message: "Nota enviada ao TMDB com sucesso!" };
      } else {
        throw new Error(rateData.status_message || "Erro desconhecido do TMDB");
      }
    } catch (error) {
      console.error("Erro ao enviar para o TMDB:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // BUSCAR AVALIAÇÕES (Comunidade Rimuflix)
  // ==========================================
  async getReviewsByMedia(tmdb_id, media_type) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          users ( name, avatar_url )
        `,
        )
        .eq("tmdb_id", tmdb_id)
        .eq("media_type", media_type)
        .order("created_at", { ascending: false }); // Traz as mais recentes primeiro

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      return { success: false, error: error.message };
    }
  },
};
