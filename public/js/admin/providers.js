class AdminProviders {
  constructor() {
    this.providers = [];

    this.form = document.getElementById("form-add-provider");
    this.grid = document.getElementById("providers-grid");

    this.init();
  }

  async init() {
    await this.fetchProviders();
    this.setupListeners();
  }

  setupListeners() {
    this.form.addEventListener("submit", (e) => this.handleAddProvider(e));
  }

  async fetchProviders() {
    try {
      const response = await fetch("/api/v1/admin/providers");
      const result = await response.json();
      if (result.success) {
        this.providers = result.data || [];
        this.renderProviders();
      }
    } catch (error) {
      console.error("Erro ao carregar provedores:", error);
      this.grid.innerHTML =
        '<p style="color: #ef4444;">Erro ao carregar dados.</p>';
    }
  }

  renderProviders() {
    if (this.providers.length === 0) {
      this.grid.innerHTML =
        '<p style="color: var(--text-secondary);">Nenhum provedor configurado.</p>';
      return;
    }

    this.grid.innerHTML = this.providers
      .map((prov, index) => {
        // Define a cor da badge baseada no tipo
        let badgeColor = "success";
        if (prov.type === "Embed") badgeColor = "warning";
        if (prov.type === "Torrent") badgeColor = "info";

        let icon = "fa-server";
        if (prov.type === "Embed") icon = "fa-play";
        if (prov.type === "Torrent") icon = "fa-magnet";

        return `
        <div class="card provider-card">
          <div class="provider-actions">
            <button class="btn-action danger btn-delete" data-index="${index}" title="Remover">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div class="provider-icon">
            ${prov.icon ? `<img src="${prov.icon}" alt="${prov.name}" />` : `<i class="fa-solid ${icon}"></i>`}
          </div>
          <h3>${prov.name}</h3>
          <p title="${prov.url}">${prov.url}</p>
          <div class="provider-footer">
             <span class="badge ${badgeColor}">${prov.type}</span>
          </div>
        </div>
      `;
      })
      .join("");

    // Adiciona o evento de excluir em todos os botões novos gerados
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleDeleteProvider(e));
    });
  }

  async handleAddProvider(e) {
    e.preventDefault();

    const newProvider = {
      id: "prov_" + Date.now(), // ID único para controle interno
      name: document.getElementById("provider_name").value.trim(),
      url: document.getElementById("provider_url").value.trim(),
      icon: document.getElementById("provider_url_icon").value.trim(),
      type: document.getElementById("provider_type").value,
    };

    // Adiciona ao array local e salva tudo no banco
    this.providers.push(newProvider);
    await this.saveProvidersToDB();

    this.form.reset();
  }

  async handleDeleteProvider(e) {
    if (!confirm("Tem certeza que deseja remover este provedor?")) return;

    // Acha o índice do botão clicado e remove do array
    const button = e.target.closest(".btn-delete");
    const index = button.getAttribute("data-index");

    this.providers.splice(index, 1);
    await this.saveProvidersToDB();
  }

  async saveProvidersToDB() {
    try {
      const response = await fetch("/api/v1/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers: this.providers }),
      });

      const result = await response.json();
      if (result.success) {
        this.renderProviders();
      } else {
        alert("Erro ao salvar: " + result.error);
      }
    } catch (error) {
      console.error("Erro na requisição de salvar:", error);
      alert("Erro ao salvar o provedor.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminProviders();
});
