export function createMediaCard(movie, type) {
  const title =
    movie?.title || movie?.name || movie?.original_name || "Sem título";
  const year =
    movie?.release_date?.split("-")[0] ||
    movie?.first_air_date?.split("-")[0] ||
    "----";
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : "0.0";

  const poster = movie?.poster_path
    ? `https://media.themoviedb.org/t/p/w300_and_h450_face${movie.poster_path}`
    : "";

  const isMovie = type === "movie" || type === "Filme";
  const displayType = isMovie ? "Filme" : "Série";
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
      
      <!-- Link movido para cá e usando class em vez de ID -->
      <a href="${href}" class="card-link" aria-label="Acessar ${title}"></a>
    </div>
  `;
}
