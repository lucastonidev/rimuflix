import * as listService from "../components/list-service.js";
import { showToastGlobal } from "../utils/utils.js";

export default class MyList {
  constructor() {
    this.gridContainer = document.getElementById("folders-grid");
    this.actionsContainer = document.getElementById("mylist-actions");
    this.allLists = [];
  }

  async init() {
    // 1. Injeta o HTML do Modal escondido no ecrã
    this.injectCreateModal();

    // 2. Busca todas as listas do utilizador
    this.allLists = await listService.getUserLists();

    // 3. Monta os botões do topo (Nova Lista e Importar)
    this.setupActions();

    // 4. Renderiza as pastas na tela
    this.renderFolders();
  }

  setupActions() {
    if (!this.actionsContainer) return;

    this.actionsContainer.innerHTML = `
      <button id="btn-create-list" class="btn-modern-action primary">
        <i class="fa-solid fa-plus"></i> Nova Lista
      </button>
      <button id="btn-import-list" class="btn-modern-action">
        <i class="fa-solid fa-file-import"></i> Importar Backup (.txt)
      </button>
    `;

    // Chama a função de abrir o modal em vez do prompt()
    document
      .getElementById("btn-create-list")
      .addEventListener("click", () => this.openCreateModal());
    document
      .getElementById("btn-import-list")
      .addEventListener("click", () => this.importListFromFile());
  }

  injectCreateModal() {
    // Evita duplicar o modal caso a classe seja instanciada duas vezes
    if (document.getElementById("create-list-modal")) return;

    const modalHtml = `
      <div class="modal-overlay" id="create-list-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">Criar Nova Playlist</h3>
            <button id="close-create-list" class="modal-close-icon">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body" style="text-align: left; padding: 0 24px 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; color: var(--text-secondary); font-weight: 500;">Nome da Playlist</label>
            <input type="text" id="new-list-input" placeholder="Ex: Animes de Romance..." autocomplete="off" style="width: 100%; padding: 14px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--tertiary-bg); color: #fff; outline: none; font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s;">
            <button id="submit-new-list" class="btn-modern-action primary" style="width: 100%; justify-content: center; margin-top: 20px; padding: 14px;">
              Criar Playlist
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Mapeamento dos elementos do modal
    const modal = document.getElementById("create-list-modal");
    const closeBtn = document.getElementById("close-create-list");
    const submitBtn = document.getElementById("submit-new-list");
    const input = document.getElementById("new-list-input");

    // Estilo de foco dinâmico para o input
    input.addEventListener(
      "focus",
      () => (input.style.borderColor = "var(--accent)"),
    );
    input.addEventListener(
      "blur",
      () => (input.style.borderColor = "rgba(255,255,255,0.1)"),
    );

    // Eventos para fechar o modal (Botão X ou clicando no fundo escuro)
    closeBtn.addEventListener("click", () => this.closeCreateModal());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.closeCreateModal();
    });

    // Eventos para submeter (Botão ou tecla Enter)
    submitBtn.addEventListener("click", () => this.handleCreateListSubmit());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleCreateListSubmit();
    });
  }

  openCreateModal() {
    const modal = document.getElementById("create-list-modal");
    if (modal) {
      modal.classList.add("active");
      const input = document.getElementById("new-list-input");
      input.value = "";
      // Pequeno delay para o focus funcionar corretamente após a animação de entrada do CSS
      setTimeout(() => input.focus(), 100);
    }
  }

  closeCreateModal() {
    const modal = document.getElementById("create-list-modal");
    if (modal) {
      modal.classList.remove("active");
    }
  }

  async handleCreateListSubmit() {
    const input = document.getElementById("new-list-input");
    const name = input.value.trim();
    const btn = document.getElementById("submit-new-list");

    if (!name) {
      showToastGlobal("Por favor, insira um nome para a lista.", "warning");
      input.focus();
      return;
    }

    // Feedback visual de carregamento
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A criar...';
    btn.disabled = true;

    try {
      await listService.createList(name);
      showToastGlobal("Lista criada com sucesso!", "success");
      this.closeCreateModal();

      // Recarrega as listas da base de dados e atualiza o ecrã
      this.allLists = await listService.getUserLists();
      this.renderFolders();
    } catch (error) {
      showToastGlobal(error.message || "Erro ao criar lista.", "error");
    } finally {
      // Restaura o botão caso algo falhe ou ao fechar
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }

  renderFolders() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = "";

    if (!this.allLists || this.allLists.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="global-empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <h3>Nenhuma lista encontrada</h3>
          <p>Você ainda não criou nenhuma lista personalizada.</p>
        </div>
      `;
      return;
    }

    // Ordena para que a "Favoritos" seja sempre a primeira
    const sortedLists = [...this.allLists].sort((a, b) => {
      if (a.name === "Favoritos") return -1;
      if (b.name === "Favoritos") return 1;
      return 0;
    });

    sortedLists.forEach((list) => {
      const isFavorite = list.name === "Favoritos";
      const itemCount = list.items ? list.items.length : 0;

      const card = document.createElement("div");
      card.className = `folder-card ${isFavorite ? "favorite-folder" : ""}`;

      const iconClass = isFavorite ? "fa-heart" : "fa-folder";
      const privacyBadge = list.is_public
        ? '<span class="privacy-badge public"><i class="fa-solid fa-earth-americas"></i> Pública</span>'
        : '<span class="privacy-badge"><i class="fa-solid fa-lock"></i> Privada</span>';

      const deleteBtnHtml = !isFavorite
        ? `<button class="btn-delete-folder" data-id="${list.id}" title="Excluir Lista"><i class="fa-solid fa-trash"></i></button>`
        : "<div></div>";

      card.innerHTML = `
        <div class="folder-header">
          <div class="folder-icon">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          ${deleteBtnHtml}
        </div>
        <div class="folder-info">
          <h3>${list.name}</h3>
          <div class="folder-meta">
            <span><i class="fa-solid fa-film"></i> ${itemCount} itens</span>
            ${privacyBadge}
          </div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-delete-folder")) return;
        window.location.href = `/playlist/${list.id}`;
      });

      const deleteBtn = card.querySelector(".btn-delete-folder");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (
            confirm(
              `Tem a certeza que deseja apagar a lista "${list.name}" permanentemente?`,
            )
          ) {
            await this.deleteList(list.id);
          }
        });
      }

      this.gridContainer.appendChild(card);
    });
  }

  async deleteList(listId) {
    try {
      await listService.deleteList(listId);
      showToastGlobal("Lista apagada com sucesso!", "success");
      this.allLists = await listService.getUserLists();
      this.renderFolders();
    } catch (error) {
      showToastGlobal("Erro ao apagar a lista.", "error");
    }
  }

  importListFromFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      const lines = text
        .split("\n")
        .map((line) => line.replace(/^#\d+\./, "").trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        showToastGlobal(
          "O ficheiro está vazio ou o formato é inválido.",
          "error",
        );
        return;
      }

      const listName = file.name.replace(".txt", "");
      showToastGlobal(
        `A iniciar a importação de ${lines.length} itens. Isto pode demorar, não feche a página!`,
        "info",
      );

      try {
        const createRes = await listService.createList(listName);
        const newListId = createRes.data?.id || createRes.id;
        let addedCount = 0;

        for (const title of lines) {
          try {
            const searchRes = await fetch(
              `/api/v1/search?q=${encodeURIComponent(title)}&page=1`,
            ).then((r) => r.json());
            if (
              searchRes.success &&
              searchRes.data &&
              searchRes.data.results &&
              searchRes.data.results.length > 0
            ) {
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
          await new Promise((r) => setTimeout(r, 300));
        }

        showToastGlobal(
          `Importação concluída! ${addedCount} de ${lines.length} adicionados.`,
          "success",
        );
        this.allLists = await listService.getUserLists();
        this.renderFolders();
      } catch (error) {
        console.error(error);
        showToastGlobal("Erro fatal ao importar o ficheiro.", "error");
      }
    };
    input.click();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MyList().init();
});
