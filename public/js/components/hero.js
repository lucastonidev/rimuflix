import ApiService from "../api.js";

class HeroGenerator {
  constructor() {
    this.GenreList = undefined;
    this.isLoggedIn = false; // Será atualizado via API
  }

  async getMovieGenresMap() {
    try {
      const data = await new ApiService().GetGenreList();
      this.GenreList = data["data"]["genres"];
      return data["genres"];
    } catch (error) {
      console.error("Erro ao buscar gêneros:", error);
      return [];
    }
  }

  getGenreNames(genreIds, genresList) {
    if (!Array.isArray(genreIds) || !Array.isArray(genresList)) return [];

    return genresList
      .filter((genre) => genreIds.includes(genre.id))
      .map((genre) => genre.name);
  }

  dateFormart(data) {
    const formart = data["first_air_date"] || data["release_date"];
    return formart ? formart.split("-")[0] : "";
  }

  /**
   * Chama o backend para descobrir se quem está acessando é usuário, visitante ou admin
   */
  async checkUserSession() {
    try {
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      this.isLoggedIn = result.success && result.data ? true : false;
    } catch (error) {
      console.error("Erro ao validar sessão na API:", error);
      this.isLoggedIn = false;
    }
  }

  /**
   * Renderiza o banner assumindo total controle sobre a lógica de botões primários.
   * Na Home, não enviamos botões extras. No Detalhe, enviamos o botão Watchlist e o Progresso.
   */
  async renderHero(
    data,
    type = "movie",
    extraActionsHtml = null,
    progressItem = null,
  ) {
    const checks = [];
    if (!this.GenreList) checks.push(this.getMovieGenresMap());
    checks.push(this.checkUserSession());

    await Promise.all(checks);

    const movie = data;
    const article = document.createElement("article");
    article.classList.add("hero");
    article.setAttribute(
      "style",
      `--hero-bg: url(https://image.tmdb.org/t/p/w1280/${movie.backdrop_path})`,
    );

    const watchUrl = `/${type}/watch/${movie.id}`;
    let primaryButton = "";

    // 1. Lógica centralizada do Botão Principal (Assistir / Continuar Assistindo / Entrar)
    if (this.isLoggedIn) {
      if (type === "tv" && progressItem) {
        // Se for série E houver progresso salvo
        const season = progressItem.seasonNumber || progressItem.season_number;
        const ep = progressItem.episodeNumber || progressItem.episode_number;
        primaryButton = `
          <a href="${watchUrl}?season=${season}&episode=${ep}" class="btn-primary">
            <i class="fa-solid fa-play"></i>
            Continuar a assistir ${season}T ${ep}EP
          </a>
        `;
      } else {
        // Filme comum ou Série sem progresso
        primaryButton = `
          <a href="${watchUrl}" class="btn-primary">
            <i class="fa-solid fa-play"></i>
            Assistir
          </a>
        `;
      }
    } else {
      // Visitante
      primaryButton = `
        <a href="/login" class="btn-primary" style="background-color: #555; border-color: #555;">
          <i class="fa-solid fa-lock"></i>
          Entrar para Assistir
        </a>
      `;
    }

    let finalActionsHtml = primaryButton;

    // 2. Lógica para Botões Secundários
    if (extraActionsHtml !== null) {
      // Se foi chamado pelo detail.js (anexa o botão Watchlist)
      finalActionsHtml += extraActionsHtml;
    } else {
      // Se foi chamado pelo script.js da Home (anexa o botão "Mais Detalhes")
      finalActionsHtml += `
        <a href="/${type}/${movie.id}" class="btn-secondary">
          <i class="fa-solid fa-circle-info"></i>
          Mais detalhes
        </a>
      `;
    }

    article.innerHTML = `
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <h1 title="${movie.title || movie.name}">${movie.title || movie.name || "Título não disponível"}</h1>
        <div class="hero-meta">
          <span class="card-badge">${this.dateFormart(movie)}</span>
          <span class="circle-separetor"></span>
          <span class="card-badge">
            ${movie.vote_average?.toFixed(1) || 0.0}
          </span>
        </div>
        <div class="genre-list"></div>
        <p class="hero-overview">${movie.overview || "Sinopse não disponível"}</p>
        <div class="hero-actions">
          ${finalActionsHtml}
        </div>
      </div>
    `;

    const extractedGenreIds =
      movie.genre_ids || (movie.genres ? movie.genres.map((g) => g.id) : []);
    const genres = this.getGenreNames(extractedGenreIds, this.GenreList);

    const genreElements = genres
      .map((genre) => `<span class="card-badge">${genre}</span>`)
      .join("");

    article.querySelector(".genre-list").innerHTML = genreElements;

    return article;
  }
}

export { HeroGenerator };
