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
    <div class="movie-title-row">
      <h1 id="movieTitle" class="movie-title">${media.title}</h1>
      <button class="copy-title-button" type="button" title="Copiar título" aria-label="Copiar título">
        <i class="fa-regular fa-copy"></i>
      </button>
    </div>
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
    <div class="movie-title-row">
      <h1 id="movieTitle" class="movie-title">${media.name}</h1>
      <button class="copy-title-button" type="button" title="Copiar título" aria-label="Copiar título">
        <i class="fa-regular fa-copy"></i>
      </button>
    </div>
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

export function setupCopyTitleButton(container) {
  const button = container?.querySelector(".copy-title-button");
  if (!button) return;

  button.addEventListener("click", async () => {
    try {
      const title = container.querySelector(".movie-title")?.textContent.trim();
      await copyTextToClipboard(title);
      button.innerHTML = '<i class="fa-solid fa-check"></i>';
      showToastGlobal("Título copiado!", "success");
    } catch (error) {
      console.error("Erro ao copiar título:", error);
      showToastGlobal("Não foi possível copiar o título.", "error");
    } finally {
      setTimeout(() => {
        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 1500);
    }
  });
}
import { copyTextToClipboard, showToastGlobal } from "../utils/utils.js";
