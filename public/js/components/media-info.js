// components/media-info.js
const formatRuntime = (runtime) => {
  if (!runtime || Number.isNaN(runtime)) return "00H 00M";
  const hours = String(Math.floor(runtime / 60)).padStart(2, "0");
  const minutes = String(runtime % 60).padStart(2, "0");
  return `${hours}H ${minutes}M`;
};

export function renderMovieInfo(media) {
  return `
    <div class="movie-header">
    <a class="btn-back" href="/movie/${media.id}" title="Voltar para pagina do filme">
    <i class="fa-solid fa-angle-left"></i>
    </a>
    <h1 id="movieTitle" class="movie-title">${media.title}</h1>
    </div>
      <div class="movie-meta">
        <span id="ratting" class="match">
          ${media.vote_average?.toFixed(1)}
          <i class="fa-solid fa-star"></i>
        </span>
        <span id="movie-year" class="badge"
          >${media.release_date?.split("-")[0]}</span
        >
        <span id="time" class="badge">${formatRuntime(media.runtime)}</span>
      </div>
    </div>
  `;
}

export function renderTvInfo(media, currentSeason, currentEpisode) {
  return `
    <h1 id="movieTitle" class="movie-title">${media.name}</h1>
    <div class="movie-meta">
      <span id="ratting" class="match">
        ${media.vote_average?.toFixed(1)}
        <i class="fa-solid fa-star"></i>
      </span>
      <span id="ratting" class="badge">
        T${currentSeason} · EP${currentEpisode}
      </span>
      <span id="ratting" class="badge">
        ${media.first_air_date?.split("-")[0]}
      </span>
    </div>
  `;
}
