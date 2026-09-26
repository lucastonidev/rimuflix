// src/reviews/review.service.js
import { supabase } from "../../config/supabase.js"; // Ajuste o caminho do seu projeto
import * as tmdbClient from "../tmdb/tmdb.client.js"; // Ajuste o caminho do seu projeto

export async function saveInternalReview({
  user_id,
  tmdb_id,
  rating,
  comment,
}) {
  const { data, error } = await supabase
    .from("reviews")
    .insert([{ user_id, tmdb_id: String(tmdb_id), rating, comment }]);

  if (error) throw error;
  return data;
}

export async function sendReviewToTMDB({
  tmdb_id,
  media_type,
  rating,
  guest_session_id,
}) {
  // O TMDB usa notas de 0.5 a 10. Se seu app usa de 1 a 5 estrelas, basta multiplicar por 2.
  const tmdbRating = rating * 2;

  // Chama a função diretamente do seu client!
  const result = await tmdbClient.submitRating(
    media_type,
    tmdb_id,
    tmdbRating,
    guest_session_id,
  );

  return result;
}
