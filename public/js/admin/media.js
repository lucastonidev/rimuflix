import ApiService from "../api.js";

class AdminMedia {
  constructor() {
    this.api = new ApiService();

    // Mapeamento dos elementos do formulário
    this.form = document.getElementById("form-add-media");
    this.tmdbIdInput = document.getElementById("tmdb_id");
    this.typeSelect = document.getElementById("media_type");
    this.titleInput = document.getElementById("title");
    this.torrentInput = document.getElementById("torrent_links");
    this.driveInput = document.getElementById("drive_links");

    this.seasonInput = document.getElementById("season_number");
    this.episodeInput = document.getElementById("episode_number");

    // Elementos de Preview (Visualização)
    this.previewContainer = document.getElementById("media-preview");
    this.previewImage = document.getElementById("preview-image");
    this.previewTitle = document.getElementById("preview-title");
    this.previewType = document.getElementById("preview-type");

    this.init();
  }

  init() {
    if (!this.form) return;

    this.tmdbIdInput.addEventListener("blur", () => this.fetchTmdbData());
    this.typeSelect.addEventListener("change", () => {
      this.fetchTmdbData();
      this.toggleTvFields();
    });

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.toggleTvFields();
  }

  toggleTvFields() {
    const isTv = this.typeSelect.value === "tv";
    if (this.seasonInput && this.seasonInput.parentElement) {
      this.seasonInput.parentElement.style.display = isTv ? "block" : "none";
    }
    if (this.episodeInput && this.episodeInput.parentElement) {
      this.episodeInput.parentElement.style.display = isTv ? "block" : "none";
    }
  }

  async fetchTmdbData() {
    const id = this.tmdbIdInput.value.trim();
    const type = this.typeSelect.value;

    if (!id || !type) return;

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

          this.previewContainer.classList.add("active");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do TMDB:", error);
      alert("Mídia não encontrada no TMDB. Verifique o ID e o Tipo.");
      this.previewContainer?.classList.remove("active");
    }
  }

  // Converte texto separado por vírgula ou quebra de linha em um Array de objetos
  parseLinks(inputText, keyName) {
    if (!inputText) return null; 
    let url;
    switch (keyName) {
      case "drive":
        const id = inputText.trim().split("/")[5];
        return [
          {
            url: `https://drive.google.com/file/d/${id}/preview`,
          },
        ];
        break;

      case "magnet":
        return inputText;
        break;

      default:
        const lines = inputText
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        return lines.map((link) => ({ [keyName]: link }));
        break;
    }
    return url;
  }

  async handleSubmit(e) {
    e.preventDefault();

    // Monta o payload processando os links
    const payload = {
      tmdb_id: this.tmdbIdInput.value.trim(),
      media_type: this.typeSelect.value,
      title: this.titleInput.value.trim(),
      season_number:
        this.typeSelect.value === "tv" && this.seasonInput
          ? this.seasonInput.value
          : null,
      episode_number:
        this.typeSelect.value === "tv" && this.episodeInput
          ? this.episodeInput.value
          : null,
      torrent_links: this.parseLinks(this.torrentInput.value, "magnet"),
      drive_links: this.parseLinks(this.driveInput.value, "drive"),
    };

    try {
      const response = await fetch("/api/v1/admin/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert("Mídia adicionada com sucesso!");
        this.form.reset();
        this.previewContainer?.classList.remove("active");
      } else {
        alert("Erro ao salvar: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      alert("Erro de conexão ao tentar salvar a mídia.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminMedia();
});
