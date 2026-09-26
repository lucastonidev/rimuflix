import { STORAGE_KEYS } from "../components/storageKeys.js";
import ApiService from "../api.js";
import { createMediaCard } from "../components/media-card.js";
import * as listService from "../components/list-service.js";

export default class MyList {
  constructor() {
    this.api = new ApiService();
    this.activeListId = "default";

    // Mapeando o DOM
    this.tabsContainer = document.getElementById("playlist-tabs");
    this.gridContainer = document.getElementById("playlist-grid");
    this.titleEl = document.getElementById("current-list-title");
    this.btnDeleteList = document.getElementById("btn-delete-list");

    // Arrays separados para a lista oficial e para as criadas pelo usuário
    this.defaultWatchlist = [];
    this.customLists = [];
  }

  async init() {
    // 1. Busca a lista "Favoritos" (Nuvem se logado, Local se visitante)
    this.defaultWatchlist = await listService.getFavorites();

    // 2. Busca as listas personalizadas do usuário (por enquanto ficam no localStorage)
    const storedLists = await listService.getCustomLists();

    // Remove a lista 'default' do array local para não duplicar, pois a tratamos de forma especial agora
    this.customLists = storedLists.filter((list) => list.id !== "default");

    this.setupListeners();
    this.renderTabs();
  }

  setupListeners() {
    this.btnDeleteList.addEventListener("click", () =>
      this.deleteCurrentList(),
    );
  }

  // Função auxiliar que junta a lista da nuvem com as listas locais
  getAllLists() {
    return [
      { id: "default", name: "Favoritos", items: this.defaultWatchlist },
      ...this.customLists,
    ];
  }

  renderTabs() {
    this.tabsContainer.innerHTML = "";

    const allLists = this.getAllLists();

    allLists.forEach((list) => {
      const li = document.createElement("li");
      li.className = `playlist-tab ${list.id === this.activeListId ? "active" : ""}`;
      li.innerHTML = `
        <span>${list.name}</span>
        <span class="tab-count">${list.items.length}</span>
      `;

      li.addEventListener("click", () => {
        if (this.activeListId !== list.id) {
          this.activeListId = list.id;
          this.renderTabs(); // Re-renderiza para atualizar a classe 'active'
        }
      });

      this.tabsContainer.appendChild(li);
    });

    this.renderCurrentList();
  }

  async renderCurrentList() {
    const currentList = this.getAllLists().find(
      (l) => l.id === this.activeListId,
    );
    this.titleEl.textContent = currentList.name;

    if (currentList.id === "default") {
      this.btnDeleteList.classList.add("hidden");
    } else {
      this.btnDeleteList.classList.remove("hidden");
    }

    if (currentList.items.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="empty-list-msg">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
          <h3>Esta lista está vazia</h3>
          <p>Explore o catálogo e adicione algo para assistir mais tarde.</p>
        </div>
      `;
      return;
    }

    // NOVA TELA DE LOADING (SKELETONS NO LUGAR DO SPINNER)
    const skeletonCard = `
      <div class="skeleton-card" style="width: 100%;">
        <div class="skeleton-poster"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    `;
    this.gridContainer.innerHTML = skeletonCard.repeat(
      currentList.items.length,
    );

    try {
      const itemPromises = currentList.items.map((item) =>
        this.api.GetById(item.type, item.id),
      );
      const responses = await Promise.all(itemPromises);

      this.gridContainer.innerHTML = "";

      responses.forEach((res, index) => {
        if (res.data) {
          const itemInfo = currentList.items[index];
          const displayType = itemInfo.type === "movie" ? "Filme" : "Série";

          const cardWrapper = document.createElement("div");
          cardWrapper.className = "continue-card-wrapper";
          cardWrapper.innerHTML = `
            <button class="remove-continue-btn" data-id="${itemInfo.id}" title="Remover da lista">
                <i class="fa-solid fa-xmark"></i>
            </button>
            ${createMediaCard(res.data, displayType)}
          `;

          const removeBtn = cardWrapper.querySelector(".remove-continue-btn");
          removeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            // Chama a nova função assíncrona para deletar do banco
            await this.removeItemFromList(
              currentList.id,
              itemInfo.id,
              itemInfo.type,
            );
          });

          this.gridContainer.appendChild(cardWrapper);
        }
      });
    } catch (error) {
      console.error("Erro ao carregar lista:", error);
      this.gridContainer.innerHTML =
        '<div class="empty-list-msg">Ops! Houve um erro ao buscar as informações dos filmes.</div>';
    }
  }

  async removeItemFromList(listId, itemId, itemType) {
    if (listId === "default") {
      await removeFavorite(itemId, itemType);
      this.defaultWatchlist = await getWatchlistState();
    } else {
      const list = this.customLists.find((l) => l.id === listId);
      if (list) {
        list.items = list.items.filter(
          (i) => !(String(i.id) === String(itemId) && i.type === itemType),
        );
        this.saveCustomLists();
      }
    }
    this.renderTabs();
  }

  deleteCurrentList() {
    if (this.activeListId === "default") return;
    if (
      confirm(
        `Tem certeza que deseja apagar a lista "${this.titleEl.textContent}" inteira?`,
      )
    ) {
      this.customLists = this.customLists.filter(
        (l) => l.id !== this.activeListId,
      );
      this.activeListId = "default"; // Volta a seleção para a aba principal
      this.saveCustomLists();
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
}
