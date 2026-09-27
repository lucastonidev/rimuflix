import { HeroGenerator } from "./components/hero.js";
import { createMediaCard } from "./components/media-card.js";
import { continueWaching } from "./components/continue-watching.js";
import ApiService from "./api.js";

class App {
  constructor() {
    this.HeroElement = document.getElementById("page-container");
    this.introOverlay = document.getElementById("intro-overlay");
    this.introVideo = document.getElementById("intro-video");
    this.skipBtn = document.getElementById("skip-intro-btn");
  }

  async init() {
    const hasSeenIntro = sessionStorage.getItem("rimuflix:hasSeenIntro");
    if (hasSeenIntro || !this.introOverlay) {
      this.skipIntroImmediately();
      await this.loadAppContent();
      document.body.classList.remove("hidde-scroll");
      return;
    }
    const dataLoadingPromise = this.loadAppContent();
    const introVideoPromise = this.waitIntroVideo();
    await Promise.all([dataLoadingPromise, introVideoPromise]);
    sessionStorage.setItem("rimuflix:hasSeenIntro", "true");
    this.revealHome();
  }

  async loadAppContent() {
    await this.loadHeroMovie();
    await this.loadWatchingContinue();
    await this.loadSections();
  }

  waitIntroVideo() {
    return new Promise((resolve) => {
      let isResolved = false;
      const finishIntro = () => {
        if (!isResolved) {
          isResolved = true;
          resolve();
        }
      };
      if (this.introVideo) {
        this.introVideo.onended = finishIntro;
        this.introVideo.onerror = finishIntro;
      }
      if (this.skipBtn) {
        this.skipBtn.addEventListener("click", finishIntro);
      }
      setTimeout(finishIntro, 4500);
    });
  }

  skipIntroImmediately() {
    if (this.introOverlay) {
      this.introOverlay.style.display = "none";
    }
    this.HeroElement.classList.add("ready");
    document.body.classList.add("hidde-scroll");
  }

  revealHome() {
    document.body.classList.remove("hidde-scroll");
    this.introOverlay.classList.add("hidden");
    this.HeroElement.classList.remove("scaling-intro");
    this.HeroElement.classList.add("ready");
    setTimeout(() => {
      if (this.introVideo) this.introVideo.pause();
      if (this.introOverlay) this.introOverlay.remove();
    }, 600);
  }

  async loadHeroMovie() {
    try {
      const hero = new HeroGenerator();
      const response = await new ApiService().GetHeroMovieAndTvFromIndexPage();

      if (!response.success) {
        throw new Error("Dados do filme não foram encontrados");
      }

      const banner = await hero.renderHero(
        response.data,
        response.data.media_type || "movie",
      );
      document.getElementById("hero-container").appendChild(banner);

      // REMOVIDO o this.loadSections() daqui!
    } catch (error) {
      console.error("Erro ao carregar o herói:", error);
    }
  }

  setupCarousel(slider) {
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
      const walk = (x - startX) * 2; // Multiplicador de velocidade

      // Se moveu mais de 5px, consideramos que é um arrasto e não um clique
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      slider.scrollLeft = scrollLeft - walk;
    });

    // Impede a abertura do link se o usuário estiver apenas arrastando o carrossel
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

  async loadWatchingContinue() {
    let historyData = await continueWaching();

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const rawProgress =
      JSON.parse(localStorage.getItem("rimuflix:watch-progress")) || [];

    // Filtra os dados se existirem
    if (historyData && historyData.length > 0) {
      historyData = historyData.filter((media) => {
        const progressItem = rawProgress.find(
          (p) => String(p.tmdbId) === String(media.id),
        );
        if (progressItem && progressItem.timestamp) {
          return now - progressItem.timestamp < SEVEN_DAYS;
        }
        return true;
      });
    } else {
      historyData = [];
    }

    const container = document.getElementById("continue-watching-container");

    // Lógica do Empty State: Mostra uma mensagem caso não haja histórico
    if (!historyData || historyData.length === 0) {
      const emptyArticle = document.createElement("article");
      emptyArticle.classList.add("movie-section", "container");
      emptyArticle.innerHTML = `
        <h2 class="section-title">Continue Assistindo</h2>
        <div class="empty-list-msg" style="padding: 40px; text-align: center; color: var(--text-secondary); background: var(--secondary-bg); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 20px;">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
          <h3 style="color: var(--text-primary); font-size: 1.2rem; margin-bottom: 8px;">Você ainda não assistiu a nada</h3>
          <p>Explore nosso catálogo e comece a maratonar! Seus filmes e séries em andamento aparecerão aqui.</p>
        </div>
      `;
      container.appendChild(emptyArticle);
      return;
    }

    const article = document.createElement("article");
    article.classList.add("movie-section", "container");
    article.innerHTML = `
          <h2 class="section-title">Continue Assistindo</h2>
          <section class="movie-list"></section>
        `;

    const movieList = article.querySelector(".movie-list");

    historyData.forEach((media) => {
      const displayType = media.name ? "Série" : "Filme";
      const mediaType = media.name ? "tv" : "movie"; // Define o tipo para a API

      const cardWrapper = document.createElement("div");
      cardWrapper.className = "continue-card-wrapper";

      cardWrapper.innerHTML = `
            <button class="remove-continue-btn" data-id="${media.id}" data-type="${mediaType}" title="Remover da lista">
                <i class="fa-solid fa-xmark"></i>
            </button>
            ${createMediaCard(media, displayType)}
        `;

      movieList.appendChild(cardWrapper);
    });

    article.querySelectorAll(".remove-continue-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const idToRemove = btn.getAttribute("data-id");
        const typeToRemove = btn.getAttribute("data-type"); // Captura o tipo exato

        import("./components/watch-progress.js").then((module) => {
          // Passa o ID e o Tipo correto (movie ou tv)
          module.removeWatchProgress(idToRemove, typeToRemove);
          btn.parentElement.remove();

          // Se a lista ficar vazia após a remoção
          if (movieList.children.length === 0) {
            container.innerHTML = ""; // Limpa o container
            const emptyArticle = document.createElement("article");
            emptyArticle.classList.add("movie-section", "container");
            emptyArticle.innerHTML = `
              <h2 class="section-title">Continue Assistindo</h2>
              <div
                class="empty-list-msg"
                style="padding: 40px; text-align: center; color: var(--text-secondary); background: var(--secondary-bg); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 20px;"
              >
                <i
                  class="fa-solid fa-clock-rotate-left"
                  style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"
                ></i>
                <h3
                  style="color: var(--text-primary); font-size: 1.2rem; margin-bottom: 8px;"
                >
                  Você ainda não assistiu a nada
                </h3>
                <p>
                  Explore nosso catálogo e comece a maratonar! Seus filmes e
                  séries em andamento aparecerão aqui.
                </p>
              </div>
            `;
            container.appendChild(emptyArticle);
          }
        });
      });
    });

    container.appendChild(article);

    // Aplica o evento de arrastar na lista recém criada
    this.setupCarousel(movieList);
  }

  async loadSections() {
    try {
      const response = await fetch("/api/v1/home/sections");
      const data = await response.json();

      const sectionsContainer = document.getElementById("sections-container");

      for (const section of data.sections) {
        const article = document.createElement("article");
        article.classList.add("movie-section", "container");
        article.innerHTML = `
          <h2 class="section-title">${section.title}</h2>
          <section class="movie-list"></section>
        `;
        const movieList = article.querySelector(".movie-list");
        section.items.forEach((movie) => {
          movieList.innerHTML += createMediaCard(
            movie,
            section.type === "movie" ? "Filme" : "Série",
          );
        });

        sectionsContainer.appendChild(article);

        // Aplica o evento de arrastar em cada seção da Home
        this.setupCarousel(movieList);
      }
    } catch (error) {
      console.error("Erro ao carregar seções da Home:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App();
  document.body.classList.add("hidde-scroll");
  await app.init();
});
