import ApiService from "../api.js";
import { createMediaCard } from "../components/media-card.js";

class SearchPage {
  constructor() {
    this.api = new ApiService();
    this.totalPages = 1;

    this.urlParams = new URLSearchParams(window.location.search);

    this.state = {
      query: "",
      type: "all",
      genre: this.urlParams.get("genre") || "",
      sort: "popularity.desc",
      year: "",
      provider: "",
      saga: "",
      saga_type: "",
      page: 1,
    };

    this.elements = {
      searchInput: document.getElementById("searchInput"),
      searchButton: document.getElementById("searchButton"),
      resultsContainer: document.getElementById("search-results"),
      typeNavLinks: document.querySelectorAll("#type-nav a"),
      genreList: document.getElementById("genre-list"),

      // Modal
      filterModal: document.getElementById("filter-modal"),
      btnOpenFilters: document.getElementById("btn-open-filters"),
      btnCloseFilters: document.getElementById("btn-close-filters"),
      btnApplyFilters: document.getElementById("btn-apply-filters"),
      btnClearFilters: document.getElementById("btn-clear-filters"),
      sortChips: document.querySelectorAll("#sort-chips .filter-chip"),
      providerChips: document.querySelectorAll("#provider-chips .filter-chip"),
      yearInput: document.getElementById("year-filter"),

      // NOVOS ELEMENTOS: Paginação
      paginationContainer: document.getElementById("pagination-container"),
      btnPrevPage: document.getElementById("btn-prev-page"),
      btnNextPage: document.getElementById("btn-next-page"),
      paginationInfo: document.getElementById("pagination-info"),
    };

    this.genresData = [];
  }

  async init() {
    await this.loadGenres();
    await this.loadSagasFilters();
    this.setupEventListeners();
    this.setupModal();
    this.setupCarousel();
    this.performSearch();
  }

  async loadGenres() {
    try {
      const response = await this.api.GetGenreList();
      if (response && response.data && response.data.genres) {
        const genres = response.data.genres;
        this.genresData = genres;

        let html = `<button class="genre-btn ${!this.state.genre ? "active" : ""}" data-id="">
          ${!this.state.genre ? '<span class="active-indicator">|</span> ' : ""}Todos
        </button>`;

        genres.forEach((genre) => {
          const isActive = String(this.state.genre) === String(genre.id);
          const indicator = isActive
            ? '<span class="active-indicator">|</span> '
            : "";
          html += `<button class="genre-btn ${isActive ? "active" : ""}" data-id="${genre.id}">${indicator}${genre.name}</button>`;
        });

        this.elements.genreList.innerHTML = html;

        const genreBtns =
          this.elements.genreList.querySelectorAll(".genre-btn");
        genreBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            genreBtns.forEach((b) => {
              b.classList.remove("active");
              const ind = b.querySelector(".active-indicator");
              if (ind) ind.remove();
            });

            btn.classList.add("active");
            btn.insertAdjacentHTML(
              "afterbegin",
              '<span class="active-indicator">|</span> ',
            );

            this.state.genre = btn.dataset.id;
            // Se selecionar gênero, a busca por texto deve ser limpa para priorizar o filtro
            this.state.query = "";
            this.elements.searchInput.value = "";
            this.state.page = 1;
            this.performSearch();
          });
        });
      }
    } catch (error) {
      console.error("Erro ao carregar gêneros:", error);
    }
  }

  setupEventListeners() {
    this.elements.typeNavLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.elements.typeNavLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");

        this.state.type = link.dataset.type;
        this.state.page = 1;
        this.performSearch();
      });
    });

    this.elements.searchButton.addEventListener("click", this.handleSearch);

    this.elements.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearch();
      }
    });

    if (this.elements.btnPrevPage) {
      this.elements.btnPrevPage.addEventListener("click", () => {
        if (this.state.page > 1) {
          this.state.page--;
          this.performSearch();
          window.scrollTo({ top: 0, behavior: "smooth" }); // Sobe a tela suavemente
        }
      });
    }

    if (this.elements.btnNextPage) {
      this.elements.btnNextPage.addEventListener("click", () => {
        if (this.state.page < this.totalPages) {
          this.state.page++;
          this.performSearch();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  }

  setupModal() {
    const closeModal = () => {
      this.elements.filterModal.classList.remove("active");
      document.body.style.overflow = "";
    };

    this.elements.btnOpenFilters.addEventListener("click", () => {
      this.elements.filterModal.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    this.elements.btnCloseFilters.addEventListener("click", closeModal);
    this.elements.filterModal.addEventListener("click", (e) => {
      if (e.target === this.elements.filterModal) closeModal();
    });

    // Seleção de ordenação
    this.elements.sortChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        this.elements.sortChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        this.state.sort = chip.dataset.value;
      });
    });

    // Seleção de Provedor (Streaming) com toggle (clica para ativar, clica para desativar)
    this.elements.providerChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        if (chip.classList.contains("active")) {
          chip.classList.remove("active");
          this.state.provider = ""; // Desativa
        } else {
          this.elements.providerChips.forEach((c) =>
            c.classList.remove("active"),
          );
          chip.classList.add("active");
          this.state.provider = chip.dataset.value; // Ativa
        }
      });
    });

    this.elements.btnClearFilters.addEventListener("click", () => {
      this.elements.sortChips.forEach((c) => c.classList.remove("active"));
      this.elements.sortChips[0].classList.add("active");
      this.state.sort = "popularity.desc";

      this.elements.providerChips.forEach((c) => c.classList.remove("active"));
      this.state.provider = "";

      this.elements.yearInput.value = "";
      this.state.year = "";

      this.state.saga = "";
      this.state.saga_type = "";

      // 👇 Limpa visualmente o botão da saga ativado
      if (this.elements.sagaChips) {
        this.elements.sagaChips.forEach((c) => c.classList.remove("active"));
      }
    });

    // Botão Aplicar Filtros
    this.elements.btnApplyFilters.addEventListener("click", () => {
      this.state.year = this.elements.yearInput.value;
      // Zera a pesquisa de texto para os filtros avançados funcionarem
      this.state.query = "";
      this.elements.searchInput.value = "";
      this.state.page = 1;
      this.performSearch();
      closeModal();
    });
  }

  setupCarousel() {
    const slider = this.elements.genreList;
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      isDragging = false;
      slider.style.cursor = "grabbing";
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener("mouseleave", () => {
      isDown = false;
      slider.style.cursor = "grab";
    });

    slider.addEventListener("mouseup", () => {
      isDown = false;
      slider.style.cursor = "grab";
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;

      if (Math.abs(walk) > 5) {
        isDragging = true;
      }

      slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
      },
      { passive: false },
    );

    slider.addEventListener(
      "click",
      (e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
    slider.style.cursor = "grab";
  }

  async loadSagasFilters() {
    try {
      const response = await fetch("/api/v1/sagas");
      const result = await response.json();

      const container = document.getElementById("saga-chips");
      if (!container) return;

      if (result.success && result.data) {
        // Gera o HTML dos chips lendo do JSON
        container.innerHTML = result.data
          .map(
            (saga) =>
              `<div class="filter-chip" data-value="${saga.id}" data-sagatype="${saga.type}">${saga.name}</div>`,
          )
          .join("");

        // Mapeia os elementos recém-criados e salva na classe
        this.elements.sagaChips = container.querySelectorAll(".filter-chip");

        // Adiciona a lógica de clique (ativar/desativar)
        this.elements.sagaChips.forEach((chip) => {
          chip.addEventListener("click", () => {
            if (chip.classList.contains("active")) {
              chip.classList.remove("active");
              this.state.saga = "";
              this.state.saga_type = "";
            } else {
              // Desmarca os outros e marca o atual
              this.elements.sagaChips.forEach((c) =>
                c.classList.remove("active"),
              );
              chip.classList.add("active");
              this.state.saga = chip.dataset.value;
              this.state.saga_type = chip.dataset.sagatype;
            }
          });
        });
      }
    } catch (error) {
      console.error("Erro ao carregar sagas:", error);
      const container = document.getElementById("saga-chips");
      if (container)
        container.innerHTML =
          "<span style='color: red;'>Erro ao carregar sagas</span>";
    }
  }

  handleSearch() {
    const typedQuery = this.elements.searchInput.value.trim().toLowerCase();

    // Procura se o que foi digitado bate com algum nome de gênero
    const matchedGenre = this.genresData.find(
      (g) => g.name.toLowerCase() === typedQuery,
    );

    if (matchedGenre) {
      // Se digitou um gênero (ex: "Ação"), limpa o texto e aplica o filtro de gênero
      this.state.query = "";
      this.state.genre = matchedGenre.id;
      this.elements.searchInput.value = matchedGenre.name; // Formata com a primeira letra maiúscula

      // Opcional: Atualiza visualmente o botão do gênero correspondente
      const genreBtns = this.elements.genreList.querySelectorAll(".genre-btn");
      genreBtns.forEach((btn) => btn.classList.remove("active"));
      const activeBtn = Array.from(genreBtns).find(
        (btn) => parseInt(btn.dataset.id) === matchedGenre.id,
      );
      if (activeBtn) activeBtn.classList.add("active");
    } else {
      // Busca normal de texto
      this.state.query = this.elements.searchInput.value.trim();
      this.state.genre = ""; // Limpa qualquer filtro de gênero prévio
    }

    this.state.page = 1;
    this.performSearch();
  }

  async performSearch() {
    // Feedback Visual: Skeletons responsivos mantendo o aspect-ratio
    const skeletonCard = `
      <div class="skeleton-card" style="width: 100%; aspect-ratio: 2/3;">
        <div class="skeleton-poster" style="height: 100%;"></div>
      </div>
    `;

    this.elements.resultsContainer.innerHTML = skeletonCard.repeat(12);

    if (this.elements.paginationContainer) {
      this.elements.paginationContainer.style.display = "none";
    }

    try {
      let url = "";

      switch (this.state.type) {
        case "doramas":
          url = `/api/v1/doramas?page=${this.state.page}`;
          break;

        case "Brasileiras":
          url = `/api/v1/novelas/brasileira?page=${this.state.page}`;
          break;

        case "Mexicanas":
          url = `/api/v1/novelas/mexicanas?page=${this.state.page}`;
          break;

        default:
          const params = new URLSearchParams();
          if (this.state.query) params.append("q", this.state.query);
          if (this.state.type !== "all") params.append("type", this.state.type);
          if (this.state.genre) params.append("genres", this.state.genre);
          if (this.state.sort) params.append("sort", this.state.sort);
          if (this.state.year) params.append("year", this.state.year);
          if (this.state.provider) {
            params.append("provider", this.state.provider);
          }

          if (this.state.saga) {
            params.append("saga", this.state.saga);
            params.append("saga_type", this.state.saga_type);
          }
          params.append("page", this.state.page);
          url = `/api/v1/search?${params.toString()}`;
          break;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (
        result.success &&
        result.data &&
        result.data.results &&
        result.data.results.length > 0
      ) {
        this.totalPages = Math.min(result.data.total_pages || 1, 500);
        this.renderResults(result.data.results);
        this.renderPagination();
      } else {
        // Feedback Visual (Heurística): Tela de "Nada encontrado" amigável
        this.elements.resultsContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 8px;">Nenhum resultado encontrado</h3>
            <p>Tente ajustar os filtros ou buscar por outros termos.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      // Feedback Visual (Heurística): Tratamento de erro de rede
      this.elements.resultsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #ff6b6b;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 15px;"></i>
          <h3>Erro de conexão</h3>
          <p>Não foi possível carregar os resultados no momento. Verifique sua internet.</p>
        </div>
      `;
    }
  }

  renderResults(results) {
    this.elements.resultsContainer.innerHTML = "";

    results.forEach((item) => {
      if (item.media_type === "person") return;

      let tipoMedia = item.media_type;

      if (!tipoMedia) {
        if (
          ["tv", "doramas", "Brasileiras", "Mexicanas"].includes(
            this.state.type,
          )
        ) {
          tipoMedia = "tv";
        } else {
          tipoMedia = "movie";
        }
      }

      this.elements.resultsContainer.innerHTML += createMediaCard(
        item,
        tipoMedia,
      );
    });
  }

  renderPagination() {
    if (!this.elements.paginationContainer) return;

    if (this.totalPages <= 1) {
      this.elements.paginationContainer.style.display = "none";
      return;
    }

    this.elements.paginationContainer.style.display = "flex";

    this.elements.paginationInfo.textContent = `Página ${this.state.page} de ${this.totalPages}`;

    this.elements.btnPrevPage.disabled = this.state.page <= 1;
    this.elements.btnNextPage.disabled = this.state.page >= this.totalPages;
  }
}

export default SearchPage;
