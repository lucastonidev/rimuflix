import ApiService from "../api.js";

class AdminMedia {
  constructor() {
    this.api = new ApiService();

    // Mapeamento dos elementos do formulário
    this.form = document.getElementById("form-add-media");
    this.linkTypeBtns = document.querySelectorAll(".btn-link-type");
    this.tmdbIdInput = document.getElementById("tmdb_id");
    this.typeSelect = document.getElementById("media_type");
    this.titleInput = document.getElementById("title");
    this.torrentInput = document.getElementById("torrent_links");
    this.driveInput = document.getElementById("drive_links");

    // Elementos das seções dinâmicas
    this.groupTorrent = document.getElementById("group-torrent");
    this.groupDrive = document.getElementById("group-drive");
    this.linksContainer = document.getElementById("links-container");

    // Novos elementos
    this.btnSearchTmdb = document.getElementById("btn-search-tmdb");
    this.tvFieldsSection = document.getElementById("tv-fields-section");
    this.stepLinksBadge = document.getElementById("step-links-badge");

    this.seasonInput = document.getElementById("season_number");
    this.episodeInput = document.getElementById("episode_number");

    // Elementos de Preview e UI
    this.previewContainer = document.getElementById("media-preview");
    this.previewImage = document.getElementById("preview-image");
    this.previewTitle = document.getElementById("preview-title");
    this.previewType = document.getElementById("preview-type");
    this.btnSubmit = document.getElementById("btn-submit-media");
    this.pageTitle = document.getElementById("page-title");

    this.editId = null;

    this.init();
  }

  // 👇 NOVO: Método de Toast Dinâmico
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
    if (!this.form) return;

    this.btnSearchTmdb.addEventListener("click", () => this.fetchTmdbData());
    this.tmdbIdInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.fetchTmdbData();
      }
    });

    this.typeSelect.addEventListener("change", () => {
      this.toggleTvFields();
      this.previewContainer.classList.remove("active");
    });

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.toggleTvFields();

    if (this.linkTypeBtns) {
      this.linkTypeBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const type = e.currentTarget.dataset.show;
          this.setLinkToggleState(type);
        });
      });
      this.setLinkToggleState("torrent");
    }

    const urlParts = window.location.pathname.split("/");
    if (urlParts.includes("edit")) {
      this.editId = urlParts[urlParts.length - 1];
      await this.loadMediaForEdit();
    }
  }

  setLinkToggleState(type) {
    this.linkTypeBtns.forEach((b) => b.classList.remove("active"));
    const activeBtn = Array.from(this.linkTypeBtns).find(
      (b) => b.dataset.show === type,
    );
    if (activeBtn) activeBtn.classList.add("active");

    if (type === "torrent") {
      this.groupTorrent.classList.remove("hidden-field");
      this.groupDrive.classList.add("hidden-field");
      this.linksContainer.classList.add("single-column");
    } else if (type === "drive") {
      this.groupTorrent.classList.add("hidden-field");
      this.groupDrive.classList.remove("hidden-field");
      this.linksContainer.classList.add("single-column");
    } else if (type === "both") {
      this.groupTorrent.classList.remove("hidden-field");
      this.groupDrive.classList.remove("hidden-field");
      this.linksContainer.classList.remove("single-column");
    }
  }

  toggleTvFields() {
    const isTv = this.typeSelect.value === "tv";
    if (this.tvFieldsSection) {
      this.tvFieldsSection.style.display = isTv ? "block" : "none";
      this.stepLinksBadge.textContent = isTv ? "3" : "2";
    }
  }

  async fetchTmdbData() {
    const id = this.tmdbIdInput.value.trim();
    const type = this.typeSelect.value;

    if (!id || !type) {
      this.showToast(
        "Por favor, preencha o ID do TMDB antes de buscar.",
        "warning",
      );
      return;
    }

    const originalBtnHtml = this.btnSearchTmdb.innerHTML;
    this.btnSearchTmdb.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i>';
    this.btnSearchTmdb.disabled = true;

    try {
      const response = await this.api.GetById(type, id);

      if (response && response.data) {
        const media = response.data;
        const title = media.title || media.name;

        this.titleInput.value = title;

        if (this.previewContainer) {
          this.previewImage.src = media.poster_path
            ? `https://image.tmdb.org/t/p/w200${media.poster_path}`
            : "/img/fallback.png";

          this.previewTitle.textContent = title;
          this.previewType.textContent = type === "movie" ? "Filme" : "Série";
          this.previewType.className =
            type === "movie" ? "badge warning" : "badge info";

          this.previewContainer.classList.add("active");
          this.showToast("Mídia localizada com sucesso!", "success");
        }
      } else {
        this.showToast("Nenhuma mídia encontrada com este ID.", "error");
        this.previewContainer.classList.remove("active");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do TMDB:", error);
      this.showToast("Falha de conexão com o TMDB.", "error");
      this.previewContainer.classList.remove("active");
    } finally {
      this.btnSearchTmdb.innerHTML = originalBtnHtml;
      this.btnSearchTmdb.disabled = false;
    }
  }

  formatLinksForTextarea(linksData, keyName) {
    if (!linksData) return "";

    if (keyName === "drive") {
      if (Array.isArray(linksData)) {
        return linksData.map((l) => l.url || "").join("\n");
      }
      return linksData;
    }

    if (keyName === "magnet") {
      if (typeof linksData === "string") return linksData;
      if (Array.isArray(linksData)) {
        return linksData.map((l) => l.magnet || l).join("\n");
      }
    }
    return "";
  }

  async loadMediaForEdit() {
    try {
      const response = await fetch("/api/v1/admin/media");
      const result = await response.json();

      if (result.success) {
        const media = result.data.find(
          (m) => String(m.id) === String(this.editId),
        );
        if (media) {
          this.populateForm(media);
        } else {
          this.showToast(
            "Mídia não encontrada. Ela pode ter sido deletada.",
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados para edição:", error);
      this.showToast("Erro ao carregar os dados desta mídia.", "error");
    }
  }

  populateForm(media) {
    if (this.pageTitle) this.pageTitle.textContent = "Editar Mídia";
    if (this.btnSubmit) {
      this.btnSubmit.innerHTML =
        '<i class="fa-solid fa-pen"></i> Atualizar Mídia';
    }

    this.tmdbIdInput.value = media.tmdb_id;
    this.typeSelect.value = media.media_type;
    this.titleInput.value = media.title;

    this.toggleTvFields();
    if (media.media_type === "tv") {
      this.seasonInput.value = media.season_number || "";
      this.episodeInput.value = media.episode_number || "";
    }

    const hasTorrent = media.torrent_links && media.torrent_links.length > 0;
    const hasDrive = media.drive_links && media.drive_links.length > 0;

    if (hasTorrent && hasDrive) {
      this.setLinkToggleState("both");
    } else if (hasDrive) {
      this.setLinkToggleState("drive");
    } else {
      this.setLinkToggleState("torrent");
    }

    this.driveInput.value = this.formatLinksForTextarea(
      media.drive_links,
      "drive",
    );
    this.torrentInput.value = this.formatLinksForTextarea(
      media.torrent_links,
      "magnet",
    );

    this.fetchTmdbData();
  }

  parseLinks(inputText, keyName) {
    if (!inputText) return null;
    switch (keyName) {
      case "drive":
        const driveLines = inputText
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        return driveLines.map((link) => {
          try {
            const id = link.split("/")[5];
            if (id && id.length > 10)
              return { url: `https://drive.google.com/file/d/${id}/preview` };
          } catch (e) {}
          return { url: link };
        });

      case "magnet":
        return inputText;

      default:
        const lines = inputText
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        return lines.map((link) => ({ [keyName]: link }));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    // 🛑 1. VALIDAÇÃO: Bloqueia envio se a pessoa não clicou em buscar
    const tmdbId = this.tmdbIdInput.value.trim();
    const title = this.titleInput.value.trim();

    if (!tmdbId || !title) {
      this.showToast(
        "Busque e valide a mídia no TMDB antes de salvar.",
        "warning",
      );
      return;
    }

    // 🛑 2. VALIDAÇÃO DAS FONTES (Verifica a aba ativa)
    const activeTab =
      Array.from(this.linkTypeBtns).find((b) => b.classList.contains("active"))
        ?.dataset.show || "torrent";
    const torrentVal = this.torrentInput.value.trim();
    const driveVal = this.driveInput.value.trim();

    if (activeTab === "torrent" && !torrentVal) {
      this.showToast("Por favor, cole os links de Torrent.", "warning");
      this.torrentInput.focus();
      return;
    }
    if (activeTab === "drive" && !driveVal) {
      this.showToast(
        "Por favor, cole os links do Google Drive/Externo.",
        "warning",
      );
      this.driveInput.focus();
      return;
    }
    if (activeTab === "both" && (!torrentVal || !driveVal)) {
      this.showToast(
        "Preencha ambos os campos de links ou mude o filtro.",
        "warning",
      );
      return;
    }

    const originalText = this.btnSubmit.innerHTML;
    this.btnSubmit.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    this.btnSubmit.disabled = true;

    const payload = {
      tmdb_id: tmdbId,
      media_type: this.typeSelect.value,
      title: title,
      season_number:
        this.typeSelect.value === "tv" && this.seasonInput
          ? this.seasonInput.value
          : null,
      episode_number:
        this.typeSelect.value === "tv" && this.episodeInput
          ? this.episodeInput.value
          : null,
      torrent_links:
        activeTab === "torrent" || activeTab === "both"
          ? this.parseLinks(torrentVal, "magnet")
          : null,
      drive_links:
        activeTab === "drive" || activeTab === "both"
          ? this.parseLinks(driveVal, "drive")
          : null,
    };

    // Lógica para decidir se CRIA (POST) ou ATUALIZA (PUT)
    const method = this.editId ? "PUT" : "POST";
    const endpoint = this.editId
      ? `/api/v1/admin/media/${this.editId}`
      : "/api/v1/admin/media";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast(
          this.editId
            ? "Mídia atualizada com sucesso!"
            : "Mídia adicionada ao catálogo!",
          "success",
        );
        if (!this.editId) {
          this.form.reset();
          this.titleInput.value = "";
          this.previewContainer?.classList.remove("active");
        }
      } else {
        this.showToast(result.error || "Ocorreu um erro no servidor.", "error");
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      this.showToast("Erro de comunicação com o servidor.", "error");
    } finally {
      this.btnSubmit.innerHTML = originalText;
      this.btnSubmit.disabled = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminMedia();
});
