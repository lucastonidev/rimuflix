import * as listService from "./list-service.js";

export class PlaylistModal {
  constructor(data, type) {
    this.data = data;
    this.type = type;
    this.favorites = [];
    this.customLists = [];

    // Inicializa o modal assim que a classe é instanciada
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
    const btnOpen = document.getElementById("btn-add-watchlist");
    if (btnOpen) {
      btnOpen.addEventListener("click", async () => {
        const originalHtml = btnOpen.innerHTML;
        btnOpen.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';
        btnOpen.style.pointerEvents = "none";

        await this.loadLists();

        btnOpen.innerHTML = originalHtml;
        btnOpen.style.pointerEvents = "auto";
        this.overlay.classList.add("active");
      });
    }

    const btnClose = document.getElementById("close-playlist-modal");
    if (btnClose) {
      btnClose.addEventListener("click", () => {
        this.overlay.classList.remove("active");
      });
    }

    if (this.btnCreateList) {
      this.btnCreateList.addEventListener("click", () => {
        this.createNewList(this.newListInput.value);
      });
    }

    if (this.overlay) {
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) {
          this.overlay.classList.remove("active");
        }
      });
    }
  }

  async loadLists() {
    try {
      const [favs, customs] = await Promise.all([
        listService.getFavorites(),
        listService.getCustomLists(),
      ]);

      this.favorites = favs || [];
      this.customLists = customs || [];
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

  async toggleItemInList(listId, listName, itemDiv) {
    try {
      itemDiv.classList.toggle("loading");
      let result;
      if (listId === "default") {
        const toogle = this.favorites.find((l) => l.id === this.data.id);
        if (toogle) {
          result = await listService.removeFavorite(this.data.id, this.type);
        } else {
          result = await listService.addFavorite(this.data.id, this.type);
        }
      } else {
        result = await listService.removeFavorite(
          this.data.id,
          this.type,
          listName,
        );
      }

      if (result.success) {
        const icon = itemDiv.querySelector(".check-icon");
        if (result.action === "added") {
          itemDiv.classList.add("active");
          icon.classList.add("visible");
        } else {
          itemDiv.classList.remove("active");
          icon.classList.remove("visible");
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
      // Correção aqui:
      await listService.toggleCustomList(
        this.data.id,
        this.type,
        listName.trim(),
      );
      await this.loadLists();
      this.newListInput.value = "";
      this.showSuccess(`Adicionado a "${listName}"`);
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderPlaylists() {
    const allLists = this.getAllLists();
    this.listContainer.innerHTML = "";

    if (!allLists) {
      const div = document.createElement("div");
      div.className = "playlist-item favorite-item";
      div.innerHTML = `
        <div
          class="list-info"
          style="display: flex; align-items: center; gap: 10px;"
        >
          <i class="fa-solid fa-list"></i>
          <span>Favoritos</span>
        </div>
        <i
          class="fa-solid fa-check check-icon"
          style="opacity: 0; transition: 0.2s;"
        ></i>
      `;
    }

    allLists.forEach((list) => {
      const isFavorite = list.id === "default";
      const isItemInList = list.items.some(
        (item) =>
          String(item.id) === String(this.data.id) && item.type === this.type,
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

      div.addEventListener("click", () => {
        const checkIcon = div.querySelector(".check-icon");
        if (div.classList.contains("in-list")) {
          div.classList.remove("in-list");
          checkIcon.style.opacity = "0";
        } else {
          div.classList.add("in-list");
          checkIcon.style.opacity = "1";
        }

        this.toggleItemInList(list.id, list.name, div);
      });
      this.listContainer.appendChild(div);
    });
  }

  showError(message) {
    console.error(message);
    alert(message);
  }

  showSuccess(message) {
    console.log(message);
  }
}
