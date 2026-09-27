class AdminSagas {
  constructor() {
    this.form = document.getElementById("form-add-saga");
    this.grid = document.getElementById("sagas-grid");
    this.btnSubmit = document.getElementById("btn-submit-saga");
    this.init();
  }

  // Sistema de Toast Global (Idêntico ao do add-media.js)
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
    await this.fetchSagas();
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleAddSaga(e));
    }
  }

  async fetchSagas() {
    this.grid.innerHTML =
      '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

    try {
      const response = await fetch("/api/v1/sagas");
      const result = await response.json();

      if (result.success) {
        this.renderSagas(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar sagas:", error);
      this.grid.innerHTML =
        '<p style="color: var(--danger); grid-column: 1/-1; text-align: center;">Erro de conexão ao carregar os dados.</p>';
    }
  }

  renderSagas(sagas) {
    if (!sagas || sagas.length === 0) {
      this.grid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255,255,255,0.02); border-radius: 12px; color: var(--text-secondary);">Nenhuma saga cadastrada ainda.</div>';
      return;
    }

    this.grid.innerHTML = sagas
      .map(
        (saga) => `
      <div class="saga-card" data-type="${saga.type}">
        <button class="btn-delete-saga" data-id="${saga.id}" title="Excluir Saga">
          <i class="fa-solid fa-trash"></i>
        </button>
        <img src="${saga.image || "/img/fallback.png"}" class="saga-image" alt="${saga.name}" loading="lazy">
        <div class="saga-info">
          <h4 title="${saga.name}">${saga.name}</h4>
          <p>ID: ${saga.id}</p>
          <span class="saga-badge">${saga.type === "collection" ? "Coleção" : "Lista"}</span>
        </div>
      </div>
    `,
      )
      .join("");

    document.querySelectorAll(".btn-delete-saga").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleDeleteSaga(e));
    });
  }

  async handleAddSaga(e) {
    e.preventDefault();

    const idInput = document.getElementById("saga_id").value.trim();
    const nameInput = document.getElementById("saga_name").value.trim();
    const typeInput = document.getElementById("saga_type").value;
    const imageInput = document.getElementById("saga_image").value.trim();

    if (!idInput || !nameInput || !imageInput) {
      this.showToast("Preencha todos os campos corretamente.", "warning");
      return;
    }

    const originalBtnHtml = this.btnSubmit.innerHTML;
    this.btnSubmit.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    this.btnSubmit.disabled = true;

    const payload = {
      id: idInput,
      name: nameInput,
      type: typeInput,
      image: imageInput,
    };

    try {
      const response = await fetch("/api/v1/admin/sagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        this.showToast("Saga adicionada com sucesso!", "success");
        this.form.reset();
        this.fetchSagas(); // Recarrega a grade automaticamente
      } else {
        this.showToast("Erro ao adicionar: " + result.error, "error");
      }
    } catch (error) {
      this.showToast("Falha de conexão com o servidor.", "error");
    } finally {
      this.btnSubmit.innerHTML = originalBtnHtml;
      this.btnSubmit.disabled = false;
    }
  }

  async handleDeleteSaga(e) {
    const btn = e.currentTarget;
    const id = btn.getAttribute("data-id");

    if (!confirm("Tem certeza que deseja remover esta saga do catálogo?"))
      return;

    // Efeito visual no botão enquanto deleta
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
      const response = await fetch(`/api/v1/admin/sagas/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        this.showToast("Saga removida com sucesso!", "success");

        // Some com o card da tela suavemente antes de recarregar a grade
        const card = btn.closest(".saga-card");
        card.style.transform = "scale(0.9)";
        card.style.opacity = "0";

        setTimeout(() => {
          this.fetchSagas();
        }, 300);
      } else {
        this.showToast("Erro ao remover: " + result.error, "error");
        btn.innerHTML = originalIcon;
        btn.disabled = false;
      }
    } catch (error) {
      this.showToast("Falha de conexão ao tentar deletar.", "error");
      btn.innerHTML = originalIcon;
      btn.disabled = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminSagas();
});
