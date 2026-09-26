import { normalizePath } from "./utils.js";

class ApiService {
  constructor() {}

  async handleResponse(response) {
    if (response.status === 401) {
      console.warn("Sessão expirada ou inválida detectada pelo Front-end.");
      // Limpa os dados fantasmas da máquina do usuário
      localStorage.removeItem("rimuflix:user");
      localStorage.removeItem("rimuflix:userId");

      // Redireciona para o login de forma amigável
      window.location.href = `/login?continue=${encodeURIComponent(window.location.href)}`;

      // Lança erro para interromper o fluxo atual
      throw new Error("Sessão expirada");
    }
    return await response.json();
  }

  async GetHeroMovieAndTvFromIndexPage() {
    try {
      const response = await fetch("/api/v1/media/featured");
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar filme em destaque:", error);
      return [];
    }
  }

  async GetGenreList() {
    try {
      const response = await fetch("/api/v1/media/genres");
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar lista de gêneros:", error);
      return [];
    }
  }

  async GetById(type, id) {
    try {
      const endpoint = normalizePath(`/api/v1/media/${type}/${id}`);
      const response = await fetch(endpoint);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      return [];
    }
  }

  async GetSeason(id, season) {
    try {
      const endpoint = normalizePath(
        `/api/v1/media/tv/${id}/seasons/${season}`,
      );
      const response = await fetch(endpoint);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar temporada:", error);
      return [];
    }
  }

  async getAllPlayerMovie(id) {
    try {
      const response = await fetch(`/api/v1/player/movie/${id}`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar temporada:", error);
      return [];
    }
  }

  async getAllPlayerTv(id, season, episode) {
    try {
      const response = await fetch(
        `/api/v1/player/tv/${id}/${season}/${episode}`,
      );
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar temporada:", error);
      return [];
    }
  }

  async getMediaReviews(type, id) {
    try {
      const response = await fetch(`/api/v1/reviews/${type}/${id}`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      return { success: false, data: [] };
    }
  }
}

export default ApiService;
