const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);

class AdminManageMedia {
  constructor() {
    this.tableBody = document.getElementById("media-table-body");
    // Captura o input da barra de pesquisa.
    // Adapta o seletor se lhe tiveres dado um ID específico no teu HTML!
    this.searchInput = document.querySelector(".search-filter-bar input");

    this.allMedia = []; // Guarda a lista completa em memória
    this.init();
  }

  // Sistema de Toast Global Integrado
  showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-xmark";
    if (type === "warning") icon = "fa-triangle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hiding");
      toast.addEventListener("animationend", () => toast.remove());
    }, 4000);
  }

  async init() {
    await this.fetchMedia();
    this.setupListeners();
  }

  setupListeners() {
    // Escuta o que é digitado na barra de pesquisa em tempo real
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value);
      });
    }
  }

  async fetchMedia() {
    // Feedback visual enquanto carrega
    this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></td></tr>`;

    try {
      const response = await fetch("/api/v1/admin/media");
      const result = await response.json();

      if (result.success) {
        this.allMedia = result.data; // Guarda na memória para o filtro
        this.renderMedia(this.allMedia);
      } else {
        this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Erro: ${result.error}</td></tr>`;
        this.showToast("Falha ao carregar as mídias", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar mídias:", error);
      this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Erro de conexão.</td></tr>`;
      this.showToast("Falha de comunicação com o servidor", "error");
    }
  }

  // 👇 Lógica de Pesquisa Instantânea
  handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();

    // Se a barra estiver vazia, mostra tudo de novo
    if (!searchTerm) {
      this.renderMedia(this.allMedia);
      return;
    }

    // Filtra a lista comparando o Título OU o ID do TMDB
    const filteredMedia = this.allMedia.filter((media) => {
      const title = (media.title || "").toLowerCase();
      const tmdbId = String(media.tmdb_id || ""); // Converte para string para garantir

      return title.includes(searchTerm) || tmdbId.includes(searchTerm);
    });

    this.renderMedia(filteredMedia);
  }

  renderMedia(mediaList) {
    if (!mediaList || mediaList.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhum resultado encontrado.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = mediaList
      .map((media) => {
        const date = media.created_at
          ? new Date(media.created_at).toLocaleDateString("pt-BR")
          : "N/A";

        const typeLabel = media.media_type === "movie" ? "Filme" : "Série";
        const typeClass = media.media_type === "movie" ? "warning" : "info";
        const iconClass = media.media_type === "movie" ? "fa-film" : "fa-tv";

        let seasonEp = "-";
        if (media.media_type === "tv") {
          const season = media.season_number ? `T${media.season_number}` : "-";
          const ep = media.episode_number ? `EP${media.episode_number}` : "-";
          seasonEp = `${season} / ${ep}`;
        }

        return `
        <tr>
          <td>
            <div class="media-title-cell">
              <i class="fa-solid ${iconClass}"></i>
              ${escapeHtml(media.title || "Sem título")}
            </div>
          </td>
          <td><span class="badge ${typeClass}">${typeLabel}</span></td>
          
          <td style="color: var(--text-secondary); font-weight: 500;">${seasonEp}</td>
          
          <td style="font-family: monospace; color: var(--text-secondary);">${escapeHtml(media.tmdb_id)}</td>
          <td>${date}</td>
          <td style="text-align: right;">
            <a href="/admin/media/edit/${encodeURIComponent(media.id)}" class="btn btn-outline" style="padding: 6px 12px;" title="Editar">
              <i class="fa-solid fa-pen" style="margin: 0;"></i>
            </a>
            <button class="btn btn-outline btn-delete" data-id="${escapeHtml(media.id)}" style="padding: 6px 12px;" title="Excluir">
              <i class="fa-solid fa-trash" style="color: #ef4444; margin: 0;"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    this.tableBody.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleDeleteMedia(e));
    });
  }

  async handleDeleteMedia(e) {
    const btn = e.currentTarget;
    const mediaId = btn.getAttribute("data-id");

    if (
      !confirm(
        "Atenção! Tem certeza que deseja excluir esta mídia definitivamente do catálogo?",
      )
    )
      return;

    const originalIcon = btn.innerHTML;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" style="color: var(--text-secondary); margin: 0;"></i>';
    btn.disabled = true;

    try {
      const response = await fetch(`/api/v1/admin/media/${mediaId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        this.showToast("Mídia excluída com sucesso!", "success");

        // Remove também da lista em memória para não voltar a aparecer na pesquisa
        this.allMedia = this.allMedia.filter(
          (m) => String(m.id) !== String(mediaId),
        );

        const rowElement = btn.closest("tr");
        rowElement.style.transition = "all 0.4s ease";
        rowElement.style.opacity = "0";
        rowElement.style.transform = "scale(0.9)";

        setTimeout(() => {
          rowElement.remove();
          if (this.tableBody.children.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 40px;">O catálogo está vazio.</td></tr>`;
          }
        }, 400);
      } else {
        this.showToast("Erro ao excluir: " + result.error, "error");
        btn.innerHTML = originalIcon;
        btn.disabled = false;
      }
    } catch (error) {
      console.error("Erro ao excluir mídia:", error);
      this.showToast("Erro de comunicação ao excluir.", "error");
      btn.innerHTML = originalIcon;
      btn.disabled = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminManageMedia();
});
