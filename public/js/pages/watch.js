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

  async init(id, type) {
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
      if (this.players.length > 0)
        switcher.updateFrameSrc(this.players[0].embed);

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
    if (this.players.length > 0) switcher.updateFrameSrc(this.players[0].embed);

    const episodesModule = new WatchEpisodes(
      this.data,
      this.seasonData,
      this.type,
      this.id,
      this.tv,
    );
    episodesModule.init();
  }
}

export default WatchPage;
