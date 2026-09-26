import * as ReviewService from "../../services/reviews/review.service.js";

export async function handleInternalReview(req, res) {
  try {
    const { tmdb_id, rating, comment, user_id } = req.body;

    // Validação básica
    if (!tmdb_id || !rating || !user_id) {
      return res
        .status(400)
        .json({ success: false, error: "Dados incompletos." });
    }

    await ReviewService.saveInternalReview({
      user_id,
      tmdb_id,
      rating,
      comment,
    });

    return res.json({ success: true, message: "Avaliação salva com sucesso!" });
  } catch (error) {
    console.error("Erro no Controller (Internal Review):", error);
    return res
      .status(500)
      .json({ success: false, error: "Erro ao salvar avaliação." });
  }
}

export async function handleTMDBReview(req, res) {
  try {
    const { tmdb_id, media_type, rating } = req.body;
    const guest_session_id = req.headers["tmdb-guest-session"]; // Ou pegue de onde você salvar

    if (!tmdb_id || !media_type || !rating || !guest_session_id) {
      return res
        .status(400)
        .json({ success: false, error: "Dados ou sessão incompletos." });
    }

    await ReviewService.sendReviewToTMDB({
      tmdb_id,
      media_type,
      rating,
      guest_session_id,
    });

    return res.json({ success: true, message: "Enviado para o TMDB!" });
  } catch (error) {
    console.error("Erro no Controller (TMDB Review):", error);
    return res
      .status(500)
      .json({ success: false, error: "Falha ao enviar para TMDB." });
  }
}
