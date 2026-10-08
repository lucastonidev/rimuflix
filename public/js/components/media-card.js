export function createMediaCard(movie, type) {
  const title =
    movie?.title || movie?.name || movie?.original_name || "Sem título";
  const year =
    movie?.release_date?.split("-")[0] ||
    movie?.first_air_date?.split("-")[0] ||
    "----";
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : "0.0";

  const poster = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w300_and_h450_face${movie.poster_path}`
    : "";

  const isMovie = type === "movie" || type === "Filme";
  let displayType = isMovie ? "Filme" : "Série";

  // 👇 LÓGICA DO ANIME APRIMORADA (Japão, Coreia do Sul e China + Animação)
  if (!isMovie) {
    const countries = movie?.origin_country || [];

    // Verifica se a produção tem origem num destes 3 países
    const isAsianProduction =
      countries.includes("JP") ||
      countries.includes("KR") ||
      countries.includes("CN");

    // Verifica obrigatoriamente se possui o género Animação
    const hasAnimationGenre =
      movie?.genre_ids?.includes(16) || movie?.genres?.some((g) => g.id === 16);

    // Só vira "Anime" se cumprir os dois requisitos
    if (isAsianProduction && hasAnimationGenre) {
      displayType = "Anime";
    }
  }

  const href = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`;

  return `
    <div class="card">
      <div class="card-poster">
        ${
          poster
            ? `<img src="${poster}" alt="Poster de ${title}" loading="lazy">`
            : `<div class="poster-fallback">Sem imagem</div>`
        }
        <div class="card-badge">${displayType}</div>
      </div>

      <div class="card-info">
        <h3 class="card-title">${title}</h3>

        <div class="card-meta">
          <span class="card-rating">
            ${rating}
            <i class="fa-solid fa-star"></i>
          </span>
          <span class="card-year">${year}</span>
        </div>
      </div>
      
      <a href="${href}" class="card-link" aria-label="Acessar ${title}"></a>
    </div>
  `;
}
