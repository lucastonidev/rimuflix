class AdminProviders {
  constructor() {
    this.providers = [];
    this.form = document.getElementById("form-add-provider");
    this.grid = document.getElementById("providers-grid");
    this.btnSubmit = this.form
      ? this.form.querySelector("button[type='submit']")
      : null;

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
    await this.fetchProviders();
    this.setupListeners();
  }

  setupListeners() {
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleAddProvider(e));
    }
  }

  async fetchProviders() {
    this.grid.innerHTML =
      '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

    try {
      const response = await fetch("/api/v1/admin/providers");
      const result = await response.json();
      if (result.success) {
        this.providers = result.data || [];
        this.renderProviders();
      } else {
        this.showToast("Erro ao carregar provedores.", "error");
        this.grid.innerHTML =
          '<p style="color: var(--danger); text-align: center; grid-column: 1/-1;">Falha ao carregar provedores.</p>';
      }
    } catch (error) {
      console.error("Erro ao carregar provedores:", error);
      this.showToast("Erro de conexão com o servidor.", "error");
      this.grid.innerHTML =
        '<p style="color: var(--danger); text-align: center; grid-column: 1/-1;">Erro de conexão ao carregar dados.</p>';
    }
  }

  renderProviders() {
    if (this.providers.length === 0) {
      this.grid.innerHTML =
        '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 12px;">Nenhum provedor configurado no momento.</p>';
      return;
    }

    this.grid.innerHTML = this.providers
      .map((prov, index) => {
        let badgeColor = "success";
        if (prov.type === "Embed") badgeColor = "warning";
        if (prov.type === "Torrent") badgeColor = "info";

        let icon = "fa-server";
        if (prov.type === "Embed") icon = "fa-play";
        if (prov.type === "Torrent") icon = "fa-magnet";

        return `
        <div class="card provider-card">
          <div class="provider-actions">
            <button class="btn-action danger btn-delete" data-index="${index}" title="Remover Provedor">
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

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleDeleteProvider(e));
    });
  }

  async handleAddProvider(e) {
    e.preventDefault();

    const nameInput = document.getElementById("provider_name").value.trim();
    const urlInput = document.getElementById("provider_url").value.trim();

    if (!nameInput || !urlInput) {
      this.showToast("Preencha o nome e a URL base.", "warning");
      return;
    }

    const originalText = this.btnSubmit ? this.btnSubmit.innerHTML : "Salvar";
    if (this.btnSubmit) {
      this.btnSubmit.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
      this.btnSubmit.disabled = true;
    }

    const newProvider = {
      id: "prov_" + Date.now(),
      name: nameInput,
      url: urlInput,
      icon: document.getElementById("provider_url_icon").value.trim(),
      type: document.getElementById("provider_type").value,
    };

    // Adição Otimista (mostra na tela antes de salvar no servidor)
    this.providers.push(newProvider);
    const success = await this.saveProvidersToDB();

    if (success) {
      this.showToast("Provedor adicionado com sucesso!", "success");
      this.form.reset();
    } else {
      // Rollback se falhar
      this.providers.pop();
      this.renderProviders();
    }

    if (this.btnSubmit) {
      this.btnSubmit.innerHTML = originalText;
      this.btnSubmit.disabled = false;
    }
  }

  async handleDeleteProvider(e) {
    if (
      !confirm("Tem certeza que deseja remover este provedor definitivamente?")
    )
      return;

    const button = e.target.closest(".btn-delete");
    const index = button.getAttribute("data-index");

    // Efeito de carregamento
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    button.disabled = true;

    // Remoção Otimista
    const removedProvider = this.providers.splice(index, 1)[0];
    const success = await this.saveProvidersToDB();

    if (success) {
      this.showToast("Provedor removido com sucesso!", "success");
    } else {
      // Rollback se falhar no servidor
      this.providers.splice(index, 0, removedProvider);
      this.renderProviders();
    }
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
        return true;
      } else {
        this.showToast("Erro ao salvar: " + result.error, "error");
        return false;
      }
    } catch (error) {
      console.error("Erro na requisição de salvar:", error);
      this.showToast("Erro de comunicação com o servidor.", "error");
      return false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminProviders();
});
