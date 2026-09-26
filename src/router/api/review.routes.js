import express from "express";
import { ReviewModule } from "../../modules/review/review.module.js";

const reviewRoutes = express.Router();
  
// Recebe a requisição POST para avaliação interna
reviewRoutes.post("/internal", async (req, res) => {
  const { tmdb_id, media_type, rating, comment, user_id } = req.body;

  if (!user_id) {
    return res
      .status(401)
      .json({ success: false, error: "Usuário precisa estar logado." });
  }

  const result = await ReviewModule.saveInternalReview({
    tmdb_id,
    media_type,
    rating,
    comment,
    user_id,
  });

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Recebe a requisição POST para avaliação externa (TMDB)
reviewRoutes.post("/tmdb", async (req, res) => {
  const { tmdb_id, media_type, rating } = req.body;

  const result = await ReviewModule.sendToTmdb({ tmdb_id, media_type, rating });

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

reviewRoutes.get("/:media_type/:tmdb_id", async (req, res) => {
  const { media_type, tmdb_id } = req.params;

  const result = await ReviewModule.getReviewsByMedia(tmdb_id, media_type);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

export default reviewRoutes;