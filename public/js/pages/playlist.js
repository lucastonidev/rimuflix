import ApiService from "../api.js";
import { createMediaCard } from "../components/media-card.js";
import { showToastGlobal } from "../utils/utils.js";
import * as listService from "../components/list-service.js";

class PlaylistPage {
  constructor() {
    this.api = new ApiService();
    // Extrai o ID da lista da URL (ex: localhost:3000/playlist/123-abc)
    this.listId = window.location.pathname.split("/").pop();
    this.listData = null;
    this.mediaCache = []; // Guarda os itens carregados para a busca interna

    this.elements = {
      hero: document.getElementById("playlist-hero"),
      stats: document.getElementById("playlist-stats"),
      grid: document.getElementById("playlist-grid"),
      searchInput: document.getElementById("input-filter-list"),
      countLabel: document.getElementById("items-count-label"),
    };
  }

  async init() {
    document.body.classList.remove("hidde-scroll");

    if (!this.listId || this.listId === "playlist") {
      this.showError("ID da Playlist inválido.");
      return;
    }

    await this.fetchPlaylistData();
    this.setupListeners();
  }

  async fetchPlaylistData() {
    try {
      // 1. Busca os detalhes da lista via API (você precisará criar essa rota no backend)
      const response = await fetch(`/api/v1/user/lists/${this.listId}`);
      const result = await response.json();

      if (!result.success)
        throw new Error("Playlist não encontrada ou privada.");

      this.listData = result.data;
      await this.renderHero();
      await this.renderGrid();
    } catch (error) {
      console.error(error);
      this.showError("Esta playlist não existe ou é privada.");
    }
  }

  async renderHero() {
    const isOwner = await listService.isUserLoggedIn(); // Verifica se está logado para exibir opções
    const itemCount = this.listData.items ? this.listData.items.length : 0;

    let coverImage = "/img/default-playlist.png";
    let heroBg = "linear-gradient(to bottom, #141414, #000)";

    // Pega o poster do primeiro item para usar como capa (se existir)
    if (itemCount > 0) {
      try {
        const firstItem = this.listData.items[0];
        const res = await this.api.GetById(
          firstItem.media_type,
          firstItem.media_id,
        );
        if (res.success && res.data) {
          coverImage = `https://image.tmdb.org/t/p/w300${res.data.poster_path}`;
          heroBg = `url("https://image.tmdb.org/t/p/w1280${res.data.backdrop_path}")`;
        }
      } catch (e) {
        /* Falha silenciosa para a capa */
      }
    }

    this.elements.hero.style.backgroundImage = heroBg;

    let actionsHtml = `
      <button class="btn-primary playlist-btn-action" id="btn-play-all" title="Iniciar Maratona">
        <i class="fa-solid fa-play"></i> Reproduzir Tudo
      </button>
      <button class="btn-secondary playlist-btn-action" id="btn-share-playlist">
        <i class="fa-solid fa-share-nodes"></i> Compartilhar
      </button>
    `;

    // Injeta o Toggle usando as classes limpas do CSS se o utilizador for o dono
    if (isOwner) {
      actionsHtml += `
        <div class="ui-toggle-container">
          <label class="ui-toggle-label">
            <input type="checkbox" id="privacy-toggle" class="ui-toggle-input" ${this.listData.is_public ? "checked" : ""}>
            <span class="ui-toggle-slider ${this.listData.is_public ? "active" : ""}">
              <span class="ui-toggle-dot ${this.listData.is_public ? "active" : ""}"></span>
            </span>
          </label>
          <span id="privacy-text" class="ui-toggle-text">${this.listData.is_public ? "Pública" : "Privada"}</span>
        </div>
      `;
    }

    this.elements.hero.innerHTML = `
      <div class="playlist-hero-overlay"></div>
      <div class="hero-content container playlist-hero-content">
        <div class="playlist-cover-wrapper">
          <img src="${coverImage}" alt="Capa" class="playlist-cover-img">
        </div>
        <div class="playlist-info-container">
          <span class="playlist-type-label" id="playlist-type-label">${this.listData.is_public ? "Playlist Pública" : "Playlist Privada"}</span>
          <h1 class="playlist-main-title">${this.listData.name}</h1>
          <div class="playlist-meta-info">
            <span class="playlist-count-badge">${itemCount} títulos</span>
            <span id="privacy-icon">${this.listData.is_public ? '<i class="fa-solid fa-earth-americas"></i>' : '<i class="fa-solid fa-lock"></i>'}</span>
          </div>
          <div class="playlist-actions-container">
            ${actionsHtml}
          </div>
        </div>
      </div>
    `;

    // ==========================================
    // 1. OUVINTE DO BOTÃO "REPRODUZIR TUDO"
    // ==========================================
    document.getElementById("btn-play-all")?.addEventListener("click", () => {
      if (this.listData.items && this.listData.items.length > 0) {
        // Pega no primeiro item da lista
        const firstItem = this.listData.items[0];

        // 1. Salva a fila de reprodução no localStorage para o watch.js conseguir ler
        const queueData = {
          listName: this.listData.name,
          items: this.listData.items,
        };
        localStorage.setItem("rimuflix:queue", JSON.stringify(queueData));

        // 2. Redireciona com o parâmetro ?queue=true ativado
        window.location.href = `/${firstItem.media_type}/watch/${firstItem.media_id}?queue=true`;
      } else {
        showToastGlobal(
          "A playlist está vazia. Adicione títulos para maratonar!",
          "warning",
        );
      }
    });

    // ==========================================
    // 2. OUVINTE DO BOTÃO "COMPARTILHAR" (MELHORADO)
    // ==========================================
    document
      .getElementById("btn-share-playlist")
      ?.addEventListener("click", async () => {
        const shareData = {
          title: `Rimuflix - ${this.listData.name}`,
          text: `Confere esta playlist na Rimuflix: ${this.listData.name}`,
          url: window.location.href, // Pega o URL atual (ex: /playlist/123-abc)
        };

        try {
          // Se estiver no telemóvel e o browser suportar, abre a aba nativa de partilha do Android/iOS
          if (
            navigator.share &&
            /mobile|android|iphone/i.test(navigator.userAgent)
          ) {
            await navigator.share(shareData);
          } else {
            // No PC, copia o link silenciosamente
            await navigator.clipboard.writeText(shareData.url);
            showToastGlobal(
              "Link copiado para a área de transferência!",
              "success",
            );
          }
        } catch (err) {
          // Ignora erros se o utilizador cancelar a partilha nativa
          console.error("Partilha cancelada ou não suportada.", err);
        }
      });

    // ==========================================
    // 3. OUVINTE DO BOTÃO PÚBLICO/PRIVADO
    // ==========================================
    const toggleInput = document.getElementById("privacy-toggle");
    if (toggleInput) {
      toggleInput.addEventListener("change", async (e) => {
        const isPublic = e.target.checked;
        const slider = e.target.nextElementSibling;
        const dot = slider.querySelector(".ui-toggle-dot");
        const text = document.getElementById("privacy-text");
        const icon = document.getElementById("privacy-icon");
        const typeLabel = document.getElementById("playlist-type-label");

        // Altera o visual imediatamente
        slider.classList.toggle("active", isPublic);
        dot.classList.toggle("active", isPublic);

        text.textContent = isPublic ? "Pública" : "Privada";
        typeLabel.textContent = isPublic
          ? "Playlist Pública"
          : "Playlist Privada";
        icon.innerHTML = isPublic
          ? '<i class="fa-solid fa-earth-americas"></i>'
          : '<i class="fa-solid fa-lock"></i>';

        try {
          await listService.updateListVisibility(this.listId, isPublic);
          this.listData.is_public = isPublic;
          showToastGlobal(
            `Playlist agora é ${isPublic ? "Pública" : "Privada"}.`,
            "success",
          );
        } catch (err) {
          // Reverte visual em caso de erro
          e.target.checked = !isPublic;
          slider.classList.toggle("active", !isPublic);
          dot.classList.toggle("active", !isPublic);

          text.textContent = !isPublic ? "Pública" : "Privada";
          typeLabel.textContent = !isPublic
            ? "Playlist Pública"
            : "Playlist Privada";
          icon.innerHTML = !isPublic
            ? '<i class="fa-solid fa-earth-americas"></i>'
            : '<i class="fa-solid fa-lock"></i>';
          showToastGlobal("Erro ao alterar privacidade.", "error");
        }
      });
    }
  }

  async renderGrid() {
    if (!this.listData.items || this.listData.items.length === 0) {
      this.elements.grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">Esta lista está vazia.</p>`;
      this.elements.stats.innerHTML = "";
      this.elements.countLabel.textContent = "0 itens";
      return;
    }

    const skeletons = `<div class="skeleton-card" style="width: 100%; aspect-ratio: 2/3;"><div class="skeleton-poster"></div></div>`;
    this.elements.grid.innerHTML = skeletons.repeat(this.listData.items.length);

    try {
      const promises = this.listData.items.map((item) =>
        this.api.GetById(item.media_type, item.media_id),
      );

      const results = await Promise.allSettled(promises);
      this.mediaCache = [];
      this.elements.grid.innerHTML = "";

      // Variáveis para as novas estatísticas
      let totalMinutes = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let typeCounts = { movie: 0, tv: 0 };
      const genreCounts = {};

      results.forEach((result, index) => {
        if (
          result.status === "fulfilled" &&
          result.value &&
          result.value.data
        ) {
          const media = result.value.data;
          const mediaType = this.listData.items[index].media_type;
          const displayType = mediaType === "movie" ? "Filme" : "Série";

          this.mediaCache.push({ media, displayType });
          this.elements.grid.innerHTML += createMediaCard(media, displayType);

          // Cálculos de Tempo
          if (media.runtime) totalMinutes += media.runtime;
          else if (media.episode_run_time?.length > 0)
            totalMinutes +=
              media.episode_run_time[0] * (media.number_of_episodes || 1);

          // Cálculos de Gêneros
          if (media.genres) {
            media.genres.forEach((g) => {
              genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
            });
          }

          // Cálculos de Média de Avaliação
          if (media.vote_average && media.vote_average > 0) {
            totalRating += media.vote_average;
            ratingCount++;
          }

          // Composição
          typeCounts[mediaType]++;
        }
      });

      this.elements.countLabel.textContent = `${this.mediaCache.length} títulos`;
      this.renderStats(
        totalMinutes,
        genreCounts,
        totalRating,
        ratingCount,
        typeCounts,
      );
    } catch (error) {
      this.elements.grid.innerHTML = `<p style="grid-column: 1/-1; color: red;">Erro ao carregar os itens.</p>`;
    }
  }

  renderStats(totalMinutes, genreCounts, totalRating, ratingCount, typeCounts) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Acha o gênero dominante e formata "Gênero (Quantidade)"
    let topGenre = "-";
    let max = 0;
    for (const [genre, count] of Object.entries(genreCounts)) {
      if (count > max) {
        max = count;
        topGenre = `${genre} <span style="color: var(--text-secondary); font-size: 0.9rem;">(${count})</span>`;
      }
    }

    // Calcula a média das notas da lista
    const avgRating =
      ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0";

    // Formata a composição
    const formatString = `${typeCounts.tv} Séries | ${typeCounts.movie} Filmes`;

    this.elements.stats.innerHTML = `
      <div class="stat-item">
        <span>Tempo Estimado</span>
        <strong>${hours}h ${minutes}m</strong>
      </div>
      <div class="stat-item">
        <span>Gênero Dominante</span>
        <strong>${topGenre}</strong>
      </div>
      <div class="stat-item">
        <span>Média de Avaliação</span>
        <strong><i class="fa-solid fa-star" style="color: #FFF614; font-size: 0.95rem;"></i> ${avgRating}</strong>
      </div>
      <div class="stat-item hidden-mobile">
        <span>Composição</span>
        <strong>${formatString}</strong>
      </div>
    `;
  }

  setupListeners() {
    this.elements.searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      this.elements.grid.innerHTML = "";

      const filtered = this.mediaCache.filter((item) => {
        const title = (item.media.title || item.media.name || "").toLowerCase();
        return title.includes(term);
      });

      filtered.forEach((item) => {
        this.elements.grid.innerHTML += createMediaCard(
          item.media,
          item.displayType,
        );
      });

      this.elements.countLabel.textContent = `${filtered.length} resultados`;
    });
  }

  showError(msg) {
    this.elements.hero.innerHTML = `
      <div style="width: 100%; text-align: center; padding: 100px 20px;">
        <i class="fa-solid fa-folder-open fa-4x" style="color: #444; margin-bottom: 20px;"></i>
        <h2>${msg}</h2>
        <a href="/mylist" class="btn-primary" style="margin-top: 20px; display: inline-block;">Voltar para Minhas Listas</a>
      </div>
    `;
    this.elements.grid.innerHTML = "";
    this.elements.stats.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PlaylistPage().init();
});
