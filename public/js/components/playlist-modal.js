import * as listService from "./list-service.js";

export class PlaylistModal {
  constructor(data, type) {
    this.data = data;
    this.type = type;
    this.playlists = [];
    this.init();
  }

  init() {
    this.injectModalHtml();
    this.setupListeners();
  }

  injectModalHtml() {
    if (document.getElementById("playlist-modal-overlay")) {
      this.mapElements();
      return;
    }

    const modalHtml = `
      <div class="playlist-modal-overlay" id="playlist-modal-overlay">
        <div class="playlist-modal">
          <div class="playlist-header">
            <h3>Salvar em...</h3>
            <button class="playlist-close" id="close-playlist-modal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="playlist-list" id="playlist-container">
            <!-- As listas serão renderizadas aqui -->
          </div>
          <div class="playlist-create">
            <input type="text" id="new-list-name" placeholder="Nova lista...">
            <button id="btn-create-list">Criar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    this.mapElements();
  }

  mapElements() {
    this.overlay = document.getElementById("playlist-modal-overlay");
    this.listContainer = document.getElementById("playlist-container");
    this.newListInput = document.getElementById("new-list-name");
    this.btnCreateList = document.getElementById("btn-create-list");
  }

  setupListeners() {
    const btnOpen = document.getElementById("btn-open-playlists");

    if (btnOpen) {
      btnOpen.addEventListener("click", async () => {
        const originalHtml = btnOpen.innerHTML;
        // Colocamos o spinner só no botão pequeno
        btnOpen.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btnOpen.style.pointerEvents = "none";

        await this.loadLists();

        btnOpen.innerHTML = originalHtml;
        btnOpen.style.pointerEvents = "auto";
        this.overlay.classList.add("active");
      });
    }

    const btnClose = document.getElementById("close-playlist-modal");
    if (btnClose)
      btnClose.addEventListener("click", () =>
        this.overlay.classList.remove("active"),
      );

    if (this.btnCreateList) {
      this.btnCreateList.addEventListener("click", () =>
        this.createNewList(this.newListInput.value),
      );
    }

    if (this.overlay) {
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) this.overlay.classList.remove("active");
      });
    }
  }

  async loadLists() {
    try {
      this.playlists = await listService.getUserLists();
      this.renderPlaylists();
    } catch (error) {
      this.showError("Não foi possível carregar as listas.");
    }
  }

  getAllLists() {
    const favoritesList = {
      id: "default",
      name: "Favoritos",
      items: this.favorites,
    };

    return [favoritesList, ...this.customLists];
  }

  async toggleItemInList(listId, itemDiv) {
    try {
      itemDiv.classList.add("loading");
      const result = await listService.toggleListItem(
        listId,
        this.data.id,
        this.type,
      );

      if (result.success) {
        const icon = itemDiv.querySelector(".check-icon");
        if (result.action === "added") {
          itemDiv.classList.add("active", "in-list");
          icon.style.opacity = "1";
        } else {
          itemDiv.classList.remove("active", "in-list");
          icon.style.opacity = "0";
        }
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      itemDiv.classList.remove("loading");
    }
  }

  async createNewList(listName) {
    if (!listName || listName.trim() === "") return;
    try {
      // Cria a lista no banco e já adiciona o item dentro dela
      const createRes = await listService.createList(listName.trim());
      // Assumindo que a API retorne o ID da lista nova em createRes.data.id
      const newListId = createRes.data?.id || createRes.id;

      if (newListId) {
        await listService.toggleListItem(newListId, this.data.id, this.type);
      }

      await this.loadLists();
      this.newListInput.value = "";
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderPlaylists() {
    this.listContainer.innerHTML = "";

    this.playlists.forEach((list) => {
      // Identifica se é a lista de Favoritos baseada no default do DB
      const isFavorite = list.name === "Favoritos";

      // Usa media_id e media_type do novo schema
      const isItemInList =
        list.items &&
        list.items.some(
          (item) =>
            String(item.media_id) === String(this.data.id) &&
            item.media_type === this.type,
        );

      const div = document.createElement("div");
      div.className = `playlist-item ${isItemInList ? "in-list" : ""} ${isFavorite ? "favorite-item" : "custom-item"}`;

      const listIcon = isFavorite
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-solid fa-list"></i>';

      div.innerHTML = `
        <div class="list-info" style="display: flex; align-items: center; gap: 10px;">
            ${listIcon}
            <span>${list.name}</span>
        </div>
        <i class="fa-solid fa-check check-icon" style="opacity: ${isItemInList ? "1" : "0"}; transition: 0.2s;"></i>
      `;

      div.addEventListener("click", () => this.toggleItemInList(list.id, div));
      this.listContainer.appendChild(div);
    });
  }

  showError(message) {
    console.error("[DEV] Erro no PlaylistModal:", message);
    showToastGlobal(message, "error");
  }

  showSuccess(message) {
    console.log(message);
  }
}
