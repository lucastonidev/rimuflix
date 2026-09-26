import { supabase } from "../config/supabaseClient.js";
import axios from "axios"; // ou use fetch nativo se estiver no Node 18+

export async function addInternalReview(req, res) {
  const { tmdb_id, rating, comment, user_id } = req.body;

  try {
    // Insere a avaliação na tabela do Supabase que você criou
    const { data, error } = await supabase
      .from("reviews")
      .insert([{ user_id, tmdb_id: String(tmdb_id), rating, comment }]);

    if (error) throw error;

    return res.json({ success: true, message: "Avaliação salva com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar review interno:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function addTMDBReview(req, res) {
  const { tmdb_id, media_type, rating } = req.body;
  const TMDB_API_KEY = process.env.API_KEY_TMDB;

  // O TMDB usa um sistema de Guest Session (Sessão de Convidado) para avaliações anônimas
  // ou requer autenticação OAuth do TMDB. Para simplificar, assumimos que você gerou um guest_session_id.
  const guest_session_id = req.headers["tmdb-guest-session"];

  // O TMDB usa notas de 0.5 a 10. Se seu app usa 1 a 5, multiplique por 2.
  const tmdbRating = rating * 2;

  try {
    const url = `https://api.themoviedb.org/3/${media_type}/${tmdb_id}/rating?api_key=${TMDB_API_KEY}&guest_session_id=${guest_session_id}`;

    await axios.post(url, { value: tmdbRating });

    return res.json({ success: true, message: "Enviado para o TMDB!" });
  } catch (error) {
    console.error("Erro no TMDB:", error);
    return res
      .status(500)
      .json({ success: false, error: "Falha ao enviar para TMDB" });
  }
}
