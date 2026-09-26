import ApiService from "../api.js";
import * as watchProgress from "./watch-progress.js";

export class WatchEpisodes {
  constructor(data, seasonData, type, id, tvParams) {
    this.data = data;
    this.seasonData = seasonData;
    this.type = type;
    this.id = id;
    this.tv = tvParams; // { currentSeason, currentEpisode }
    this.api = new ApiService();
  }

  init() {
    if (this.type !== "tv") return;
    this.setupEpisodeNavigation();
  }

  setupEpisodeNavigation() {
    const btnPrev = document.getElementById("btnPrevEpisode");
    const btnNext = document.getElementById("btnNextEpisode");
    const badge = document.getElementById("currentEpisodeBadge");

    if (!btnPrev || !btnNext) return;

    const currentSeason = Number(this.tv.currentSeason);
    const currentEpisode = Number(this.tv.currentEpisode);

    if (badge) {
      badge.innerHTML = `<i class="fa-solid fa-list-ul"></i> Temporada ${currentSeason} · EP ${currentEpisode} <i class="fa-solid fa-chevron-down" style="margin-left: 6px; font-size: 0.75rem;"></i>`;
      badge.classList.add("clickable-badge");
      badge.onclick = () => this.openEpisodesModal();
    }

    btnPrev.disabled = currentSeason === 1 && currentEpisode === 1;

    btnPrev.onclick = () => {
      if (currentEpisode > 1) {
        this.navigateToEpisode(currentSeason, currentEpisode - 1);
      } else if (currentSeason > 1) {
        this.navigateToPreviousSeason(currentSeason - 1);
      }
    };

    btnNext.onclick = () => {
      const totalEpisodesInSeason = this.seasonData?.episodes?.length || 0;
      const totalSeasons = this.data?.number_of_seasons || 1;

      if (currentEpisode < totalEpisodesInSeason) {
        this.navigateToEpisode(currentSeason, currentEpisode + 1);
      } else if (currentSeason < totalSeasons) {
        this.navigateToEpisode(currentSeason + 1, 1);
      } else {
        alert("Você já está no último episódio da última temporada!");
      }
    };
  }

  async openEpisodesModal() {
    let modal = document.getElementById("watch-episodes-modal");
    if (!modal) {
      this.buildEpisodesModalHTML();
      modal = document.getElementById("watch-episodes-modal");
    }
    await this.loadModalSeason(this.tv.currentSeason);
    modal.classList.add("active");
  }

  buildEpisodesModalHTML() {
    const validSeasons = (this.data.seasons || []).filter(
      (s) => s.season_number > 0,
    );
    const seasonOptions = validSeasons
      .map(
        (s) =>
          `<option value="${s.season_number}" ${s.season_number == this.tv.currentSeason ? "selected" : ""}>Temporada ${s.season_number}</option>`,
      )
      .join("");

    const modalHTML = `
      <div class="watch-modal-overlay" id="watch-episodes-modal">
        <div class="watch-modal-content">
          <div class="watch-modal-header">
            <h3><i class="fa-solid fa-tv"></i> Episódios</h3>
            <button class="close-watch-modal" id="close-episodes-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="watch-modal-filters">
            <select id="modal-season-select" class="form-control" style="background: var(--primary-bg);">
              ${seasonOptions}
            </select>
          </div>
          <div class="watch-modal-body custom-scroll" id="modal-episodes-list"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    document.getElementById("close-episodes-modal").onclick = () => {
      document
        .getElementById("watch-episodes-modal")
        .classList.remove("active");
    };

    document.getElementById("watch-episodes-modal").onclick = (e) => {
      if (e.target.id === "watch-episodes-modal")
        e.target.classList.remove("active");
    };

    document.getElementById("modal-season-select").onchange = (e) => {
      this.loadModalSeason(e.target.value);
    };
  }

  async loadModalSeason(seasonNumber) {
    const listContainer = document.getElementById("modal-episodes-list");
    listContainer.innerHTML =
      '<div style="text-align:center; padding: 40px; color: var(--accent);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

    try {
      const response = await this.api.GetSeason(this.id, seasonNumber);
      if (response && response.data && response.data.episodes) {
        let html = "";
        response.data.episodes.forEach((ep) => {
          const isCurrent =
            seasonNumber == this.tv.currentSeason &&
            ep.episode_number == this.tv.currentEpisode;
          const thumb = ep.still_path
            ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
            : "https://placehold.co/300x170/141414/a3a3a3?text=Sem+Imagem";

          html += `
            <div class="watch-ep-card ${isCurrent ? "active" : ""}" data-season="${seasonNumber}" data-episode="${ep.episode_number}">
              <div class="watch-ep-thumb">
                <img src="${thumb}" alt="EP ${ep.episode_number}" loading="lazy">
                ${isCurrent ? '<div class="watch-ep-playing"><i class="fa-solid fa-chart-simple"></i></div>' : ""}
              </div>
              <div class="watch-ep-info">
                <h4>${ep.episode_number}. ${ep.name}</h4>
                <p>${ep.runtime ? ep.runtime + " min" : "Indisponível"}</p>
              </div>
            </div>
          `;
        });

        listContainer.innerHTML = html;

        listContainer.querySelectorAll(".watch-ep-card").forEach((card) => {
          card.onclick = () => {
            if (!card.classList.contains("active")) {
              this.navigateToEpisode(card.dataset.season, card.dataset.episode);
            }
          };
        });
      }
    } catch (e) {
      listContainer.innerHTML =
        '<p style="color:#ef4444; text-align:center;">Não foi possível carregar.</p>';
    }
  }

  async navigateToPreviousSeason(prevSeasonNumber) {
    try {
      const response = await this.api.GetSeason(this.id, prevSeasonNumber);
      const totalEpsInPrevSeason = response?.data?.episodes?.length || 1;
      this.navigateToEpisode(prevSeasonNumber, totalEpsInPrevSeason);
    } catch (e) {
      this.navigateToEpisode(prevSeasonNumber, 1);
    }
  }

  navigateToEpisode(season, episode) {
    watchProgress.saveWatchProgress({
      tmdbId: this.id,
      mediaType: this.type,
      seasonNumber: Number(season),
      episodeNumber: Number(episode),
    });
    window.location.href = `/${this.type}/watch/${this.id}?season=${season}&episode=${episode}`;
  }
}
