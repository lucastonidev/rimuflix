function createStarsHtml(rating) {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    const activeClass = i <= rating ? "active" : "";
    starsHtml += `<i class="fa-solid fa-star ${activeClass}"></i>`;
  }
  return starsHtml;
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);

/**
 * Cria o card individual de cada avaliação
 */
function createReviewCard(review) {
  const userName = escapeHtml(review.users?.name || "Membro Rimuflix");
  const date = new Date(review.created_at).toLocaleDateString("pt-BR");
  const starsHtml = createStarsHtml(review.rating);

  // Só renderiza a tag <p> se existir comentário
  const commentHtml = review.comment
    ? `<p class="review-comment">"${escapeHtml(review.comment)}"</p>`
    : "";

  return `
    <div class="review-card">
      <div class="review-card-header">
        <strong class="review-author">${userName}</strong>
        <span class="review-date">${date}</span>
      </div>
      <div class="review-stars">
        ${starsHtml}
      </div>
      ${commentHtml}
    </div>
  `;
}

/**
 * Renderiza a seção completa de avaliações no DOM
 */
export function renderReviewSection(reviews, insertAfterElement) {
  // Cria o container principal
  const reviewsSection = document.createElement("div");
  reviewsSection.className = "reviews-section";

  let html = `
    <h2 class="section-title">
      <i class="fa-solid fa-comments"></i> Avaliações da Comunidade (${reviews.length})
    </h2>
    <div class="reviews-list">
  `;

  if (!reviews || reviews.length === 0) {
    html += `<p class="empty-reviews-msg">Ninguém avaliou este título ainda. Seja o primeiro!</p>`;
  } else {
    // Adiciona cada card ao HTML
    reviews.forEach((review) => {
      html += createReviewCard(review);
    });
  }

  html += `</div>`;
  reviewsSection.innerHTML = html;

  // Insere no DOM
  if (insertAfterElement) {
    insertAfterElement.after(reviewsSection);
  } else {
    console.warn(
      "Elemento de referência para inserir avaliações não encontrado.",
    );
  }
}
