import ApiService from "../api.js";
import { STORAGE_KEYS } from "../components/storageKeys.js";
import { HeroGenerator } from "../components/hero.js";
import { renderEpisodeSeason } from "../components/episode-list.js";
import { renderSidebarInfo } from "../components/sidebar-info.js";
import { createMediaCard } from "../components/media-card.js";
import * as watchProgress from "../components/watch-progress.js";
import { createErrorState } from "../components/error-feedback.js";
import { getUserLists, toggleListItem } from "../components/list-service.js";
import { PlaylistModal } from "../components/playlist-modal.js";
import { renderReviewSection } from "../components/review-section.js";
import { showToastGlobal } from "../utils/utils.js";

export default class DetailPage {
  constructor() {
    this.id = null;
    this.type = null;
    this.data = {
      detail: [],
      recomendations: [],
    };
    this.currentProgress = [];
    this.season = 1;

    this.favListId = null;
  }

  async init(id, type) {
    this.id = id;
    this.type = type;
    this.currentProgress = await watchProgress.getWatchProgressState();

    // 👇 2. Busca as listas do utilizador e encontra a de "Favoritos"
    const allLists = (await getUserLists()) || [];
    const favList = allLists.find((l) => l.name === "Favoritos") || allLists[0];

    if (favList) {
      this.favListId = favList.id;
      this.currentWatchlist = favList.items || [];
    } else {
      this.currentWatchlist = [];
    }

    const detalhesCarregados = await this.fetchDetails();
    document.title = `Rimuflix - ${this.data.detail.title || this.data.detail.name}`;
    if (!detalhesCarregados) {
      const heroContainer = document.querySelector(".hero-container");
      heroContainer.innerHTML = "";
      heroContainer.appendChild(
        createErrorState(
          "Ops, não conseguimos carregar os detalhes desta mídia. Verifique sua conexão.",
          () => window.location.reload(),
        ),
      );
      return;
    }

    if (this.type == "movie") {
      await this.fetchRecomendation();
      this.renderHero();
      this.renderSidebarInfo();
      this.RenderRecomendations();
      this.loadReviews();
      document.querySelector(".episode-section").style.display = "none";
    }

    if (this.type == "tv") {
      document.querySelector(".episode-section").style.display = "block";
      await this.fetchRecomendation();
      this.renderHero();
      this.renderEpisodeList();
      this.renderSelectSeason();
      this.renderSidebarInfo();
      this.RenderRecomendations();
      this.loadReviews();
    }
  }

  setupReviewSystem() {
    const btnReview = document.getElementById("btn-open-review");
    if (!btnReview) return;

    btnReview.addEventListener("click", () => {
      if (!document.getElementById("review-modal")) {
        this.injectReviewModalHTML();
      }
      document.getElementById("review-modal").classList.add("active");
    });
  }

  injectReviewModalHTML() {
    const modalHtml = `
      <div class="modal-overlay" id="review-modal">
        <div class="modal-box review-modal-box">
          <div class="review-modal-header">
            <h3 class="review-modal-title">Avaliar: ${this.data.detail.title || this.data.detail.name}</h3>
            <button id="close-review-modal" class="modal-close-icon">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="review-form-group">
            <label class="form-label">Onde deseja avaliar?</label>
            <select id="review-destination" class="form-control">
              <option value="internal">Comunidade Rimuflix (Permite Comentário)</option>
              <option value="tmdb">Servidor TMDB (Apenas Nota)</option>
            </select>
          </div>
          <div class="review-form-group">
            <label class="form-label">Sua Nota (1 a 5):</label>
            <input type="number" id="review-rating" class="form-control" min="1" max="5" value="5">
          </div>
          <div class="review-form-group" id="review-comment-group">
            <label class="form-label">Comentário:</label>
            <textarea id="review-comment" class="form-control" rows="3" placeholder="O que você achou?"></textarea>
          </div>
          <button id="submit-review" class="btn-primary review-submit-btn">Enviar Avaliação</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    document
      .getElementById("review-destination")
      .addEventListener("change", (e) => {
        const commentGroup = document.getElementById("review-comment-group");
        commentGroup.style.display =
          e.target.value === "tmdb" ? "none" : "block";
      });

    document
      .getElementById("close-review-modal")
      .addEventListener("click", () => {
        document.getElementById("review-modal").classList.remove("active");
      });

    document
      .getElementById("submit-review")
      .addEventListener("click", () => this.submitReview());
  }

  async submitReview() {
    const destination = document.getElementById("review-destination").value;
    const rating = document.getElementById("review-rating").value;
    const comment = document.getElementById("review-comment").value;
    const userId = localStorage.getItem("rimuflix:userId");

    if (destination === "internal" && !userId) {
      showToastGlobal(
        "Você precisa estar logado para avaliar na comunidade.",
        "warning",
      );
      return;
    }

    const payload = {
      tmdb_id: this.id,
      media_type: this.type,
      rating: parseInt(rating),
      comment: comment,
      user_id: userId,
    };

    const endpoint =
      destination === "internal"
        ? "/api/v1/reviews/internal"
        : "/api/v1/reviews/tmdb";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        showToastGlobal("Obrigado pela sua avaliação!", "success");
        document.getElementById("review-modal").classList.remove("active");

        if (destination === "internal") {
          this.loadReviews(true);
        }
      } else {
        console.error(
          "[DEV] Erro ao salvar avaliação no servidor:",
          result.error,
        );
        showToastGlobal(
          "Não foi possível salvar sua avaliação. Tente novamente.",
          "error",
        );
      }
    } catch (error) {
      // Log técnico para o desenvolvedor
      console.error("[DEV] Falha na requisição fetch da avaliação:", error);
      showToastGlobal("Erro de conexão ao enviar a avaliação.", "error");
    }
  }

  async fetchDetails() {
    try {
      const response = await new ApiService().GetById(this.type, this.id);
      if (!response || !response.data)
        throw new Error("Dados inválidos da API");
      this.data.detail = response.data;
      return true;
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      return false;
    }
  }

  async fetchRecomendation() {
    try {
      const response = await fetch(
        `/api/v1/media/recomendations/${this.type}/${this.id}`,
      );
      if (!response.ok) throw new Error("Falha na rede ou na API");
      this.data.recomendations = await response.json();
    } catch (error) {
      console.error("Erro ao buscar recomendações:", error);
      const RecomendationList = document.querySelector(".recomendation-grid");
      if (RecomendationList) {
        RecomendationList.innerHTML = "";
        RecomendationList.appendChild(
          createErrorState(
            "Não foi possível carregar as recomendações no momento.",
          ),
        );
      }
    }
  }

  async renderHero() {
    const data = this.data.detail;
    if (!data) return;

    const heroContainer = document.querySelector(".hero-container");

    let progressItem = null;
    if (this.type === "tv") {
      progressItem = this.currentProgress?.find(
        (item) => String(item.tmdbId) === String(this.id),
      );
    }

    const extraActionsHtml = `
      <div style="display: flex; gap: 8px;">
        <button class="btn-secondary" id="btn-open-review" title="Avaliar este título">
          <i class="fa-solid fa-star"></i>
          Avaliar
        </button>
        <button class="btn-secondary" id="btn-add-watchlist" title="Adicionar aos Favoritos">
          <i class="fa-regular fa-heart"></i>
          Favoritar
        </button>
        <button class="btn-secondary" id="btn-open-playlists" title="Salvar em outra lista..." style="padding: 0 16px;">
          <i class="fa-solid fa-folder-plus"></i>
        </button>
      </div>
    `;

    const banner = await new HeroGenerator().renderHero(
      data,
      this.type,
      extraActionsHtml,
      progressItem,
    );

    heroContainer.appendChild(banner);
    new PlaylistModal(data, this.type);

    // Adicione esta linha para ativar o modal de avaliação:
    this.setupReviewSystem();

    if (typeof this.renderBtnAddToWatchlist === "function") {
      this.renderBtnAddToWatchlist(data);
    }
  }

  renderBtnAddToWatchlist(data) {
    const button = document.getElementById("btn-add-watchlist");
    if (!button) return;

    const updateButtonState = () => {
      if (!this.currentWatchlist) this.currentWatchlist = [];

      const isInWatchlist = this.currentWatchlist.some(
        (item) =>
          String(item.media_id) === String(data.id) &&
          item.media_type === this.type,
      );

      button.innerHTML = isInWatchlist
        ? `<i class="fa-solid fa-heart" style="color: var(--accent);"></i> Favoritado`
        : `<i class="fa-regular fa-heart"></i> Favoritar`;
    };

    updateButtonState();

    button.onclick = async () => {
      button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...`;
      button.style.pointerEvents = "none";

      try {
        if (this.favListId) {
          await toggleListItem(this.favListId, data.id, this.type);
        }

        const allLists = (await getUserLists()) || [];
        const favList = allLists.find((l) => l.id === this.favListId);
        this.currentWatchlist = favList ? favList.items : [];
      } catch (error) {
        console.error("[DEV] Erro ao atualizar lista de favoritos:", error);
        showToastGlobal("Não foi possível atualizar os favoritos.", "error");
      }

      button.style.pointerEvents = "auto";
      updateButtonState();
    };
  }

  saveEpisodeAsWatched(linkElement) {
    const newProgress = {
      tmdbId: this.id,
      mediaType: this.type,
      seasonNumber: Number(linkElement.dataset.seasonnumber),
      episodeNumber: Number(linkElement.dataset.episodenumber),
    };
    watchProgress.saveWatchProgress(newProgress);
  }

  async renderEpisodeList() {
    const seasonCurrent = this.season;
    const GetDetailSeason = await new ApiService().GetSeason(
      this.id,
      seasonCurrent,
    );
    const episodeListContainer = document.querySelector(
      ".episode-list__container",
    );

    if (GetDetailSeason) {
      episodeListContainer.innerHTML = "";
      const seasonHtml = await renderEpisodeSeason(
        GetDetailSeason,
        this.watchProgress,
        this.id,
      );
      episodeListContainer.innerHTML += seasonHtml;
      document.querySelectorAll(".episode-card-link").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          this.saveEpisodeAsWatched(link);
          window.location.href = link.href;
        });
      });
    }
  }

  async renderSelectSeason() {
    const seasonContainer = document.querySelector(".season-picker__field");
    const seasons = this.data.detail["seasons"];

    if (seasonContainer) {
      seasonContainer.innerHTML = "";

      const selectElement = document.createElement("select");
      selectElement.id = "seasonSelect";
      selectElement.className = "season-picker__select";

      const validSeasons = seasons.filter((season) => season.season_number > 0);

      validSeasons.forEach((season) => {
        const optionElement = document.createElement("option");
        optionElement.value = season.season_number;
        optionElement.textContent = `Temporada ${season.season_number}`;

        if (season.season_number == this.season) {
          optionElement.selected = true;
        }
        selectElement.appendChild(optionElement);
      });

      seasonContainer.appendChild(selectElement);

      selectElement.addEventListener("change", async () => {
        const selectedSeason = selectElement.value;
        this.season = selectedSeason;
        document.querySelector(".episode-section__title").innerHTML =
          `Temporada ${this.season}`;
        await this.renderEpisodeList();
      });
    }
  }

  async loadReviews(forceRefresh = false) {
    // Repassa o forceRefresh para a API
    const reviewResponse = await new ApiService().getMediaReviews(
      this.type,
      this.id,
      forceRefresh,
    );

    if (reviewResponse && reviewResponse.success) {
      const gridContainer = document.querySelector(".details-grid");

      // 👇 NOVO: Remove a seção antiga da tela para não duplicar
      const oldReviewSection = document.querySelector(".reviews-section");
      if (oldReviewSection) {
        oldReviewSection.remove();
      }

      renderReviewSection(reviewResponse.data, gridContainer);
    }
  }

  renderSidebarInfo() {
    if (!this.data.detail) return;
    const infoList = document.querySelector(".details-sidebar");
    infoList.innerHTML = renderSidebarInfo(this.data.detail, this.type);
  }

  RenderRecomendations() {
    if (!this.data.recomendations) return;

    const data = this.data.recomendations["data"];
    const RecomendationList = document.querySelector(".recomendation-grid");

    if (data?.results?.length) {
      for (const movie of data["results"]) {
        RecomendationList.innerHTML += createMediaCard(
          movie,
          movie["media_type"],
        );
      }
    }
  }
}
