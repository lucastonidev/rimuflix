import { STORAGE_KEYS } from "../components/storageKeys.js";
import ApiService from "../api.js";
import { createMediaCard } from "../components/media-card.js";
import * as listService from "../components/list-service.js";
import { showToastGlobal } from "../utils/utils.js";

export default class MyList {
  constructor() {
    this.api = new ApiService();
    this.activeListId = null;

    this.tabsContainer = document.getElementById("playlist-tabs");
    this.gridContainer = document.getElementById("playlist-grid");
    this.titleEl = document.getElementById("current-list-title");
    this.btnDeleteList = document.getElementById("btn-delete-list");

    this.allLists = [];
  }

  async init() {
    this.allLists = await listService.getUserLists();

    const defaultList =
      this.allLists.find((l) => l.name === "Favoritos") || this.allLists[0];
    if (defaultList) this.activeListId = defaultList.id;

    this.setupListeners();
    this.renderTabs();

    // Injeta o botão de importação na sidebar
    const sidebarHeader = document.querySelector(".sidebar-header");
    if (sidebarHeader && !document.getElementById("btn-import-list")) {
      const importBtn = document.createElement("button");
      importBtn.id = "btn-import-list";
      importBtn.className = "btn-secondary";
      importBtn.innerHTML =
        '<i class="fa-solid fa-file-import"></i> Importar .txt';
      importBtn.style.width = "100%";
      importBtn.style.marginTop = "15px";
      importBtn.style.padding = "10px";
      importBtn.style.borderRadius = "8px";
      importBtn.onclick = () => this.importListFromFile();
      sidebarHeader.appendChild(importBtn);
    }
  }

  getAllLists() {
    return [
      { id: "default", name: "Favoritos", items: this.defaultWatchlist },
      ...this.customLists,
    ];
  }

  renderTabs() {
    this.tabsContainer.innerHTML = "";

    // Puxa a lista Favoritos para ser sempre a primeira
    const sortedLists = [...this.allLists].sort((a, b) => {
      if (a.name === "Favoritos") return -1;
      if (b.name === "Favoritos") return 1;
      return 0;
    });

    sortedLists.forEach((list) => {
      const li = document.createElement("li");
      li.className = `playlist-tab ${list.id === this.activeListId ? "active" : ""}`;
      const count = list.items ? list.items.length : 0;

      li.innerHTML = `<span>${list.name}</span><span class="tab-count">${count}</span>`;

      li.addEventListener("click", () => {
        window.location.href = `/playlist/${list.id}`;
      });

      this.tabsContainer.appendChild(li);
    });

    this.renderCurrentList();
  }

  async renderCurrentList() {
    const currentList = this.allLists.find((l) => l.id === this.activeListId);
    if (!currentList) return;

    this.titleEl.textContent = currentList.name;

    // Se for a Favoritos, esconde o botão de deletar lista inteira
    if (currentList.name === "Favoritos") {
      this.btnDeleteList.classList.add("hidden");
    } else {
      this.btnDeleteList.classList.remove("hidden");
    }

    if (!currentList.items || currentList.items.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="empty-list-msg">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
          <h3>Esta lista está vazia</h3>
          <p>Explore o catálogo e adicione algo para assistir mais tarde.</p>
        </div>`;
      this.updateDashboardStats([]);
      return;
    }

    const skeletonCard = `<div class="skeleton-card" style="width: 100%;"><div class="skeleton-poster"></div></div>`;
    this.gridContainer.innerHTML = skeletonCard.repeat(
      currentList.items.length,
    );

    try {
      // Puxando usando media_type e media_id do banco
      const itemPromises = currentList.items.map((item) =>
        this.api.GetById(item.media_type, item.media_id),
      );
      const responses = await Promise.all(itemPromises);

      this.updateDashboardStats(responses);
      this.gridContainer.innerHTML = "";

      responses.forEach((res, index) => {
        if (res.data) {
          const itemInfo = currentList.items[index];
          const displayType =
            itemInfo.media_type === "movie" ? "Filme" : "Série";

          const cardWrapper = document.createElement("div");
          cardWrapper.className = "continue-card-wrapper";
          cardWrapper.innerHTML = `
            <button class="remove-continue-btn" data-id="${itemInfo.media_id}" title="Remover da lista">
                <i class="fa-solid fa-xmark"></i>
            </button>
            ${createMediaCard(res.data, displayType)}
          `;

          const removeBtn = cardWrapper.querySelector(".remove-continue-btn");
          removeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.removeItemFromList(
              currentList.id,
              itemInfo.media_id,
              itemInfo.media_type,
            );
          });

          this.gridContainer.appendChild(cardWrapper);
        }
      });
    } catch (error) {
      this.gridContainer.innerHTML =
        '<div class="empty-list-msg">Ops! Houve um erro ao buscar as informações.</div>';
    }
  }

  async removeItemFromList(listId, mediaId, mediaType) {
    await listService.toggleListItem(listId, mediaId, mediaType);
    this.allLists = await listService.getUserLists(); // Recarrega do backend
    this.renderTabs();
  }

  async deleteCurrentList() {
    const currentList = this.allLists.find((l) => l.id === this.activeListId);
    if (currentList.name === "Favoritos") return;

    if (
      confirm(
        `Tem certeza que deseja apagar a lista "${currentList.name}" inteira?`,
      )
    ) {
      await listService.deleteList(this.activeListId);
      this.allLists = await listService.getUserLists();

      const defaultList = this.allLists.find((l) => l.name === "Favoritos");
      this.activeListId = defaultList ? defaultList.id : this.allLists[0].id;

      this.renderTabs();
    }
  }

  saveCustomLists() {
    const arrayToSave = [
      { id: "default", name: "Favoritos", items: this.defaultWatchlist },
      ...this.customLists,
    ];

    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_LISTS,
      JSON.stringify(arrayToSave),
    );
  }

  setupListeners() {
    this.btnDeleteList.addEventListener("click", () =>
      this.deleteCurrentList(),
    );

    const privacyToggle = document.getElementById("privacy-toggle");
    if (privacyToggle) {
      privacyToggle.addEventListener("change", (e) =>
        this.handlePrivacyChange(e.target.checked, true),
      );
    }
  }

  async handlePrivacyChange(isPublic, saveToBackend = false) {
    const icon = document.getElementById("privacy-icon");
    const text = document.getElementById("privacy-text");
    const container = document.querySelector(".privacy-control");
    const toggleInput = document.getElementById("privacy-toggle");

    if (toggleInput && toggleInput.checked !== isPublic) {
      toggleInput.checked = isPublic;
    }

    if (isPublic) {
      icon.className = "fa-solid fa-earth-americas";
      text.textContent = "Pública";
      container.classList.add("public");
    } else {
      icon.className = "fa-solid fa-lock";
      text.textContent = "Privada";
      container.classList.remove("public");
    }

    // Gerencia o Botão de Compartilhar Link
    let shareBtn = document.getElementById("share-list-btn");
    if (isPublic) {
      if (!shareBtn) {
        shareBtn = document.createElement("button");
        shareBtn.id = "share-list-btn";
        shareBtn.innerHTML = '<i class="fa-solid fa-link"></i> Copiar Link';
        shareBtn.onclick = () => {
          const link = `${window.location.origin}/share/${this.activeListId}`;
          navigator.clipboard.writeText(link);
          showToastGlobal(
            "Link copiado para a área de transferência!",
            "success",
          );
        };
        container.after(shareBtn);
      }
      shareBtn.style.display = "flex";
    } else {
      if (shareBtn) shareBtn.style.display = "none";
    }

    if (saveToBackend && this.activeListId) {
      try {
        await listService.updateListVisibility(this.activeListId, isPublic);
        const currentList = this.allLists.find(
          (l) => l.id === this.activeListId,
        );
        if (currentList) currentList.is_public = isPublic;
      } catch (error) {
        showToastGlobal(
          "Não foi possível alterar a privacidade da lista.",
          "error",
        );
        this.handlePrivacyChange(!isPublic, false);
      }
    }
  }

  async renderCurrentList() {
    const currentList = this.allLists.find((l) => l.id === this.activeListId);
    if (!currentList) return;

    this.titleEl.textContent = currentList.name;

    // Se for a Favoritos, esconde o botão de deletar lista
    if (currentList.name === "Favoritos") {
      this.btnDeleteList.classList.add("hidden");
    } else {
      this.btnDeleteList.classList.remove("hidden");
    }

    if (!currentList.items || currentList.items.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="empty-list-msg">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
          <h3>Esta lista está vazia</h3>
          <p>Explore o catálogo e adicione algo para assistir mais tarde.</p>
        </div>`;
      this.updateDashboardStats([]);
      return;
    }

    const skeletonCard = `<div class="skeleton-card" style="width: 100%;"><div class="skeleton-poster"></div></div>`;
    this.gridContainer.innerHTML = skeletonCard.repeat(
      currentList.items.length,
    );

    try {
      const itemPromises = currentList.items.map((item) =>
        this.api.GetById(item.media_type, item.media_id),
      );

      const results = await Promise.allSettled(itemPromises);

      this.gridContainer.innerHTML = "";
      const validResponses = [];

      results.forEach((result, index) => {
        // Só tenta renderizar se o TMDB não retornou erro 404 e os dados existem
        if (
          result.status === "fulfilled" &&
          result.value &&
          result.value.data
        ) {
          validResponses.push(result.value);
          const res = result.value;
          const itemInfo = currentList.items[index];
          const displayType =
            itemInfo.media_type === "movie" ? "Filme" : "Série";

          const cardWrapper = document.createElement("div");
          cardWrapper.className = "continue-card-wrapper";
          cardWrapper.innerHTML = `
            <button class="remove-continue-btn" data-id="${itemInfo.media_id}" title="Remover da lista">
                <i class="fa-solid fa-xmark"></i>
            </button>
            ${createMediaCard(res.data, displayType)}
          `;

          const removeBtn = cardWrapper.querySelector(".remove-continue-btn");
          removeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.removeItemFromList(
              currentList.id,
              itemInfo.media_id,
              itemInfo.media_type,
            );
          });

          this.gridContainer.appendChild(cardWrapper);
        }
      });

      // Atualiza as estatísticas apenas com os filmes que ainda existem
      this.updateDashboardStats(validResponses);
    } catch (error) {
      this.gridContainer.innerHTML =
        '<div class="empty-list-msg">Ops! Houve um erro crítico ao buscar as informações.</div>';
    }
  }

  // Novo método para calcular os stats dinamicamente
  updateDashboardStats(responses) {
    let totalMinutes = 0;
    let validTitles = 0;
    const genreCounts = {};

    responses.forEach((res) => {
      if (!res || !res.data) return;
      validTitles++;
      const media = res.data;

      // Cálculo de Tempo Base (Pode ser refinado depois cruzando com a tabela `rimulist`)
      if (media.runtime) {
        totalMinutes += media.runtime; // Filmes
      } else if (media.episode_run_time && media.episode_run_time.length > 0) {
        // Séries: Estimativa (Média do episódio * total de episódios)
        const epTime = media.episode_run_time[0];
        const totalEps = media.number_of_episodes || 1;
        totalMinutes += epTime * totalEps;
      }

      // Contagem de Gêneros
      if (media.genres) {
        media.genres.forEach((g) => {
          genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
        });
      }
    });

    // 1. Atualiza Tempo Assistido
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    document.getElementById("stat-time").textContent = `${hours}h ${minutes}m`;

    // 2. Atualiza Quantidade de Títulos
    document.getElementById("stat-count").textContent = validTitles;

    // 3. Descobre o Gênero Favorito
    let topGenre = "-";
    let maxCount = 0;
    for (const [genre, count] of Object.entries(genreCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topGenre = genre;
      }
    }
    document.getElementById("stat-genre").textContent = topGenre;
  }

  importListFromFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      // O Regex abaixo limpa o padrão "#1.", "#123." e pega só o nome do anime
      const lines = text
        .split("\n")
        .map((line) => line.replace(/^#\d+\./, "").trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        showToastGlobal(
          "O arquivo está vazio ou num formato inválido.",
          "error",
        );
        return;
      }

      const listName = file.name.replace(".txt", "");
      showToastGlobal(
        `Iniciando importação de ${lines.length} itens. Isso pode demorar vários minutos, não feche a página!`,
        "info",
      );

      try {
        // Cria a lista nova
        const createRes = await listService.createList(listName);
        const newListId = createRes.data?.id || createRes.id;
        let addedCount = 0;

        // Processa item por item
        for (const title of lines) {
          try {
            // Busca o nome do anime no backend da Rimuflix (que bate na API do TMDB)
            const searchRes = await fetch(
              `/api/v1/search?q=${encodeURIComponent(title)}&page=1`,
            ).then((r) => r.json());

            if (
              searchRes.success &&
              searchRes.data &&
              searchRes.data.results &&
              searchRes.data.results.length > 0
            ) {
              // Pega o primeiro resultado (ignora pessoas)
              const firstMatch =
                searchRes.data.results.find((m) => m.media_type !== "person") ||
                searchRes.data.results[0];

              if (firstMatch && firstMatch.id) {
                const mType =
                  firstMatch.media_type || (firstMatch.name ? "tv" : "movie");
                await listService.toggleListItem(
                  newListId,
                  firstMatch.id,
                  mType,
                );
                addedCount++;
              }
            }
          } catch (err) {
            console.error(`Erro ao importar ${title}:`, err);
          }
          // Delay de 300ms entre as requisições para não dar Rate Limit na API do TMDB
          await new Promise((r) => setTimeout(r, 300));
        }

        showToastGlobal(
          `Importação concluída! ${addedCount} de ${lines.length} encontrados e adicionados.`,
          "success",
        );

        // Recarrega as abas
        this.allLists = await listService.getUserLists();
        this.activeListId = newListId;
        this.renderTabs();
      } catch (error) {
        console.error(error);
        showToastGlobal("Erro fatal ao importar a lista.", "error");
      }
    };
    input.click();
  }
}
