class AdminSettings {
  constructor() {
    this.form = document.getElementById("form-settings");
    this.inputTmdbKey = document.getElementById("tmdb_api_key");
    this.selectTheme = document.getElementById("default_theme");

    this.init();
  }

  async init() {
    await this.fetchSettings();

    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSaveSettings(e));
    }
  }

  async fetchSettings() {
    try {
      const response = await fetch("/api/v1/admin/settings");
      const result = await response.json();

      if (result.success && result.data) {
        this.inputTmdbKey.value = result.data.tmdb_api_key || "";
        this.selectTheme.value = result.data.default_theme || "dark";
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }

  async handleSaveSettings(e) {
    e.preventDefault();

    const payload = {
      tmdb_api_key: this.inputTmdbKey.value.trim(),
      default_theme: this.selectTheme.value,
    };

    try {
      const response = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert("Configurações salvas com sucesso!");
      } else {
        alert("Erro ao salvar: " + result.error);
      }
    } catch (error) {
      console.error("Erro na comunicação:", error);
      alert("Falha de conexão ao salvar as configurações.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminSettings();
});
