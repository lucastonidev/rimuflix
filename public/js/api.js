import { normalizePath } from "./utils.js";
import { IndexedDBCache } from "./components/cache-service.js";

class ApiService {
  constructor() {
    this.cache = new IndexedDBCache();
  }

  async handleResponse(response) {
    if (response.status === 401) {
      console.warn("Sessão expirada ou inválida detectada pelo Front-end.");
      localStorage.removeItem("rimuflix:user");
      localStorage.removeItem("rimuflix:userId");
      window.location.href = `/login?continue=${encodeURIComponent(window.location.href)}`;
      throw new Error("Sessão expirada");
    }
    return await response.json();
  }

  async fetchWithCache(endpoint, ttlHours = 0) {
    try {
      const url = normalizePath(endpoint);
      if (ttlHours > 0) {
        const cachedData = await this.cache.get(url);
        if (cachedData) return cachedData;
      }
      const response = await fetch(url);
      const data = await this.handleResponse(response);
      if (ttlHours > 0 && data && data.success !== false) {
        await this.cache.set(url, data, ttlHours);
      }
      return data;
    } catch (error) {
      console.error(`Erro na rota ${endpoint}:`, error);
      return [];
    }
  }

  async GetHeroMovieAndTvFromIndexPage() {
    return await this.fetchWithCache("/api/v1/media/featured", 2);
  }

  async GetGenreList() {
    return await this.fetchWithCache("/api/v1/media/genres", 168);
  }

  async GetById(type, id) {
    return await this.fetchWithCache(`/api/v1/media/${type}/${id}`, 24);
  }

  async GetSeason(id, season) {
    return await this.fetchWithCache(
      `/api/v1/media/tv/${id}/seasons/${season}`,
      24,
    );
  }

  async getMediaReviews(type, id, forceRefresh = false) {
    const url = `/api/v1/user/reviews/${type}/${id}`;

    // Se forçado, deleta o cache antigo primeiro
    if (forceRefresh) {
      await this.cache.delete(normalizePath(url));
    }

    return await this.fetchWithCache(url, 1);
  }

  async getAllPlayerMovie(id) {
    return await this.fetchWithCache(`/api/v1/player/movie/${id}`, 0);
  }

  async getAllPlayerTv(id, season, episode) {
    return await this.fetchWithCache(
      `/api/v1/player/tv/${id}/${season}/${episode}`,
      0,
    );
  }
}

export default ApiService;
