import ApiService from "../api.js";
import { renderMovieInfo, renderTvInfo } from "../components/media-info.js";
import * as watchProgress from "../components/watch-progress.js";
import { WatchSwitcher } from "../components/watch-switcher.js";
import { WatchEpisodes } from "../components/watch-episodes.js";
import { TimeTracker } from "../components/time-tracker.js";

class WatchPage {
  constructor() {
    this.id = null;
    this.type = null;
    this.data = null;
    this.seasonData = null;
    this.players = [];
    this.tv = { currentSeason: 1, currentEpisode: 1 };
    this.api = new ApiService();
  }

  async fetchDetailsFromId() {
    try {
      const response = await this.api.GetById(this.type, this.id);
      this.data = response.data;
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    }
  }

  async fetchSeasonDetails(seasonNumber) {
    try {
      const response = await this.api.GetSeason(this.id, seasonNumber);
      this.seasonData = response?.data || null;
    } catch (error) {
      this.seasonData = null;
    }
  }

  async fetchOptionPlayerMovie() {
    try {
      const response = await this.api.getAllPlayerMovie(this.id);
      // Garante que, se a API não mandar o 'data', ele vira um array vazio
      this.players = response?.data || [];
    } catch (error) {
      this.players = [];
    }
  }

  async fetchOptionPlayerTv() {
    try {

      const response = await this.api.getAllPlayerTv(
        this.id,
        this.tv.currentSeason,
        this.tv.currentEpisode,
      );
      // Mesma proteção para a busca de séries
      this.players = response?.data || [];
    } catch (error) {
      this.players = [];
    }
  }

  renderMediaInfo() {
    const container = document.querySelector(".watch-hero__content");
    if (!container) return;

    if (this.type === "movie") {
      container.innerHTML = renderMovieInfo(this.data);
    } else {
      container.innerHTML = renderTvInfo(
        this.data,
        this.tv.currentSeason,
        this.tv.currentEpisode,
      );
    }
  }

  async renderQueuePanel() {
    const urlParams = new URLSearchParams(window.location.search);
    // Se a pessoa não veio com o link da fila, não fazemos nada
    if (!urlParams.get("queue")) return;

    const queueStr = localStorage.getItem("rimuflix:queue");
    if (!queueStr) return;

    try {
      const queue = JSON.parse(queueStr);
      // Procura em que posição da lista nós estamos atualmente
      const currentIndex = queue.items.findIndex(
        (item) =>
          String(item.media_id) === String(this.id) &&
          item.media_type === this.type,
      );

      if (currentIndex !== -1) {
        const hasNext = currentIndex < queue.items.length - 1;
        const nextItem = hasNext ? queue.items[currentIndex + 1] : null;

        let btnHtml = "";
        if (hasNext) {
          const nextUrl = `/${nextItem.media_type}/watch/${nextItem.media_id}?queue=true`;
          btnHtml = `
             <a href="${nextUrl}" class="btn-primary" style="text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: flex; align-items: center; gap: 8px; white-space: nowrap;">
               Próximo da Lista <i class="fa-solid fa-forward-step"></i>
             </a>
           `;
        } else {
          btnHtml = `
             <span style="color: var(--success); font-weight: bold; display: flex; align-items: center; gap: 8px;">
               <i class="fa-solid fa-circle-check"></i> Fim da Playlist
             </span>
           `;
        }

        const panelHtml = `
          <div class="queue-panel" style="margin: 24px 0; background: rgba(20,20,24,0.8); backdrop-filter: blur(10px); padding: 16px 24px; border-radius: 12px; border: 1px solid rgba(229, 9, 20, 0.4); display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.4); flex-wrap: wrap; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                 <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(229, 9, 20, 0.15); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                   <i class="fa-solid fa-list-check"></i>
                 </div>
                 <div>
                     <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Maratona Ativa</span>
                     <h4 style="margin: 4px 0 0 0; color: #fff; font-size: 1.1rem;">${queue.listName}</h4>
                     <span style="font-size: 0.85rem; color: #ccc;">Vídeo ${currentIndex + 1} de ${queue.items.length}</span>
                 </div>
              </div>
              <div style="display: flex; justify-content: center;">
                 ${btnHtml}
              </div>
          </div>
        `;

        const playerWrapper =
          document.querySelector(".watch-player") ||
          document.getElementById("playerSwitcher");
        if (playerWrapper) {
          playerWrapper.insertAdjacentHTML("afterend", panelHtml);
        }
      }
    } catch (e) {
      console.error("Erro ao processar fila da playlist", e);
    }
  }

  async init(id, type) {
    if (!id || id === 'undefined') {
        console.error("Erro: ID inválido para a página de Watch.");
        window.location.href = "/"; // Manda de volta para a Home
        return;
    }

    this.id = id;
    this.type = type;

    await this.fetchDetailsFromId();
    if (!this.data) return;

    if (this.type === "movie") {
      watchProgress.saveWatchProgress({
        tmdbId: this.id,
        mediaType: this.type,
        timestamp: Date.now(),
      });

      // Inicializa o rastreador de tempo para filmes
      new TimeTracker({
        id: this.id,
        type: this.type,
        season: 1,
        episode: 1,
      });

      await this.fetchOptionPlayerMovie();
      this.renderMediaInfo();

      const switcher = new WatchSwitcher(
        this.players,
        this.type,
        this.id,
        this.tv,
      );
      switcher.render();
      return;
    }

    // --- Configuração para Séries ---
    const urlParams = new URL(window.location.href).searchParams;
    this.tv.currentSeason = Number(urlParams.get("season")) || 1;
    this.tv.currentEpisode = Number(urlParams.get("episode")) || 1;

    watchProgress.saveWatchProgress({
      tmdbId: this.id,
      mediaType: this.type,
      seasonNumber: this.tv.currentSeason,
      episodeNumber: this.tv.currentEpisode,
    });

    // Inicializa o rastreador de tempo para séries
    new TimeTracker({
      id: this.id,
      type: this.type,
      season: this.tv.currentSeason,
      episode: this.tv.currentEpisode,
    });

    await this.fetchSeasonDetails(this.tv.currentSeason);
    this.renderMediaInfo();

    await this.fetchOptionPlayerTv();

    // Inicia os Componentes
    const switcher = new WatchSwitcher(
      this.players,
      this.type,
      this.id,
      this.tv,
    );
    switcher.render();

    const episodesModule = new WatchEpisodes(
      this.data,
      this.seasonData,
      this.type,
      this.id,
      this.tv,
    );
    episodesModule.init();

    this.renderQueuePanel();
  }
}

export default WatchPage;
