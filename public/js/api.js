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

  // 👇 FUNÇÃO CENTRAL DE REQUISIÇÃO COM CACHE INTELIGENTE
  async fetchWithCache(endpoint, ttlHours = 0) {
    try {
      const url = normalizePath(endpoint);

      // 1. Se TTL > 0, tenta buscar no IndexedDB primeiro
      if (ttlHours > 0) {
        const cachedData = await this.cache.get(url);
        if (cachedData) return cachedData;
      }

      // 2. Faz o fetch real na Vercel
      const response = await fetch(url);
      const data = await this.handleResponse(response);

      // 3. Salva no banco local apenas se a requisição deu sucesso e se exige cache
      if (ttlHours > 0 && data && data.success !== false) {
        await this.cache.set(url, data, ttlHours);
      }

      return data;
    } catch (error) {
      console.error(`Erro na rota ${endpoint}:`, error);
      return [];
    }
  }

  // ==========================================
  // USO NOS MÉTODOS (Fica de 1 a 2 linhas cada!)
  // ==========================================

  async GetHeroMovieAndTvFromIndexPage() {
    return await this.fetchWithCache("/api/v1/media/featured", 2); // 2 horas
  }

  async GetGenreList() {
    return await this.fetchWithCache("/api/v1/media/genres", 168); // 7 dias
  }

  async GetById(type, id) {
    return await this.fetchWithCache(`/api/v1/media/${type}/${id}`, 24); // 24 horas
  }

  async GetSeason(id, season) {
    return await this.fetchWithCache(
      `/api/v1/media/tv/${id}/seasons/${season}`,
      24,
    ); // 24 horas
  }

  async getMediaReviews(type, id) {
    return await this.fetchWithCache(`/api/v1/reviews/${type}/${id}`, 1); // 1 hora
  }

  // 🚨 MÉTODOS SEM CACHE (TTL = 0)
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
