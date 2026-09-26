class AdminSagas {
  constructor() {
    this.form = document.getElementById("form-add-saga");
    this.grid = document.getElementById("sagas-grid");
    this.init();
  }

  async init() {
    await this.fetchSagas();
    this.form.addEventListener("submit", (e) => this.handleAddSaga(e));
  }

  async fetchSagas() {
    try {
      // Usamos a mesma rota pública que o Rimuflix usa para ler as sagas
      const response = await fetch("/api/v1/sagas");
      const result = await response.json();

      if (result.success) {
        this.renderSagas(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar sagas:", error);
      this.grid.innerHTML =
        '<p style="color: #ef4444;">Erro ao carregar os dados.</p>';
    }
  }

  renderSagas(sagas) {
    if (sagas.length === 0) {
      this.grid.innerHTML =
        '<p style="color: var(--text-secondary);">Nenhuma saga cadastrada.</p>';
      return;
    }

    this.grid.innerHTML = sagas
      .map(
        (saga) => `
      <div class="saga-card">
        <button class="btn-delete-saga" data-id="${saga.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        <img src="${saga.image || "/img/fallback.png"}" class="saga-image" alt="${saga.name}">
        <div class="saga-info">
          <h4>${saga.name}</h4>
          <p>ID: ${saga.id} | Tipo: ${saga.type}</p>
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

    const payload = {
      id: document.getElementById("saga_id").value.trim(),
      name: document.getElementById("saga_name").value.trim(),
      type: document.getElementById("saga_type").value,
      image: document.getElementById("saga_image").value.trim(),
    };

    try {
      const response = await fetch("/api/v1/admin/sagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        this.form.reset();
        this.fetchSagas();
      } else {
        alert("Erro ao adicionar: " + result.error);
      }
    } catch (error) {
      alert("Falha ao comunicar com o servidor.");
    }
  }

  async handleDeleteSaga(e) {
    if (!confirm("Remover esta saga do banco?")) return;

    const id = e.currentTarget.getAttribute("data-id");

    try {
      const response = await fetch(`/api/v1/admin/sagas/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        this.fetchSagas();
      } else {
        alert("Erro ao remover: " + result.error);
      }
    } catch (error) {
      alert("Falha de conexão.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminSagas();
});
