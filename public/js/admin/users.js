class AdminUsers {
  constructor() {
    this.tableBody = document.getElementById("users-table-body");
    this.footerCount = document.getElementById("users-count-footer");
    this.formAddUser = document.getElementById("form-add-user");

    // Elementos do Modal de Edição
    this.modalEdit = document.getElementById("edit-user-modal");
    this.formEdit = document.getElementById("form-edit-user");
    this.btnCloseModal = document.getElementById("close-edit-modal");
    this.usersDataList = []; // Guarda a lista atual para carregar rápido na edição

    this.init();
  }

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
    await this.fetchUsers();
    this.setupListeners();
  }

  setupListeners() {
    if (this.formAddUser) {
      this.formAddUser.addEventListener("submit", (e) =>
        this.handleCreateUser(e),
      );
    }

    // Modal de Edição Listeners
    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener("click", () => {
        this.modalEdit.classList.remove("active");
      });
    }

    if (this.modalEdit) {
      this.modalEdit.addEventListener("click", (e) => {
        if (e.target === this.modalEdit)
          this.modalEdit.classList.remove("active");
      });
    }

    if (this.formEdit) {
      this.formEdit.addEventListener("submit", (e) => this.handleEditSubmit(e));
    }
  }

  async handleCreateUser(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Cadastrando...';
    btn.disabled = true;

    const payload = {
      name: document.getElementById("user_name").value.trim(),
      email: document.getElementById("user_email").value.trim(),
      password: "defaultpassword",
      role: document.getElementById("user_role").value,
    };

    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast("Usuário criado com sucesso!", "success");
        this.formAddUser.reset();
        this.fetchUsers();
      } else {
        this.showToast("Erro ao cadastrar: " + result.error, "error");
      }
    } catch (error) {
      this.showToast("Falha na comunicação com o servidor.", "error");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  async fetchUsers() {
    try {
      this.tableBody.innerHTML =
        '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando usuários...</td></tr>';
      const response = await fetch("/api/v1/admin/users");
      const result = await response.json();

      if (result.success) {
        this.usersDataList = result.data; // Salva o estado atual
        this.renderUsers(result.data);
      } else {
        this.showError("Erro ao carregar usuários: " + result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      this.showError("Falha de conexão ao buscar usuários.");
    }
  }

  showError(message) {
    this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">${message}</td></tr>`;
  }

  getInitials(name) {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("pt-BR") +
      " " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  renderUsers(users) {
    this.footerCount.textContent = `Total: ${users.length} usuário${users.length !== 1 ? "s" : ""}`;

    if (users.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Nenhum usuário cadastrado ainda.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = users
      .map((user) => {
        const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
        const colorIndex = user.name
          ? user.name.charCodeAt(0) % colors.length
          : 0;
        const avatarColor = colors[colorIndex];

        const statusHtml = user.is_active
          ? `<div class="status-cell"><div class="status-dot"></div> Ativo</div>`
          : `<div class="status-cell" style="color: var(--text-secondary);"><div class="status-dot" style="background-color: var(--text-secondary);"></div> Bloqueado</div>`;

        // 👇 Adicionado a classe "danger" no botão de bloquear
        const blockBtnHtml = user.is_active
          ? `<button class="btn-action danger toggle-status-btn" data-id="${user.id}" data-status="true" title="Bloquear"><i class="fa-solid fa-ban" style="color: #ef4444;"></i></button>`
          : `<button class="btn-action toggle-status-btn" data-id="${user.id}" data-status="false" title="Desbloquear"><i class="fa-solid fa-check" style="color: #10b981;"></i></button>`;

        return `
        <tr>
          <td>
            <div class="user-cell">
              ${
                user.avatar_url
                  ? `<img src="${user.avatar_url}" class="user-avatar" style="object-fit: cover;">`
                  : `<div class="user-avatar" style="background-color: ${avatarColor};">${this.getInitials(user.name)}</div>`
              }
              <div>
                <strong>${user.name || "Usuário Sem Nome"}</strong>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${user.email}</div>
              </div>
            </div>
          </td>
          <td>
            ${user.role === "admin" ? '<span class="badge warning">Admin</span>' : '<span class="badge info">Membro</span>'}
          </td>
          <td style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary);">${user.id}</td>
          <td>${this.formatDate(user.created_at)}</td>
          <td>${statusHtml}</td>
          
          <!-- 👇 Envolvido em uma div para não quebrar a célula (TD) -->
          <td>
            <div class="actions-cell">
              <button class="btn-action btn-edit-user" data-id="${user.id}" title="Editar Dados">
                <i class="fa-solid fa-pen"></i>
              </button>
              ${blockBtnHtml}
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    // Aplica Listeners
    document.querySelectorAll(".toggle-status-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleToggleStatus(e));
    });

    document.querySelectorAll(".btn-edit-user").forEach((btn) => {
      btn.addEventListener("click", (e) => this.openEditModal(e));
    });
  }

  openEditModal(e) {
    const btn = e.currentTarget;
    const userId = btn.getAttribute("data-id");

    // Busca os dados do usuário na lista cacheada
    const userToEdit = this.usersDataList.find(
      (u) => String(u.id) === String(userId),
    );
    if (!userToEdit) return;

    // Popula o Modal
    document.getElementById("edit_user_id").value = userToEdit.id;
    document.getElementById("edit_user_name").value = userToEdit.name;
    document.getElementById("edit_user_email").value = userToEdit.email;
    document.getElementById("edit_user_role").value = userToEdit.role;
    document.getElementById("edit_user_password").value = ""; // Sempre vazio por segurança

    // Mostra o Modal
    this.modalEdit.classList.add("active");
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    const btnSave = document.getElementById("btn-save-edit");
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    btnSave.disabled = true;

    const userId = document.getElementById("edit_user_id").value;
    const payload = {
      name: document.getElementById("edit_user_name").value.trim(),
      email: document.getElementById("edit_user_email").value.trim(),
      role: document.getElementById("edit_user_role").value,
      password: document.getElementById("edit_user_password").value, // Só vai se for preenchido
    };

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast("Dados do usuário atualizados!", "success");
        this.modalEdit.classList.remove("active");
        this.fetchUsers(); // Recarrega a tabela
      } else {
        this.showToast("Erro ao editar: " + result.error, "error");
      }
    } catch (error) {
      this.showToast("Falha de conexão com o servidor.", "error");
    } finally {
      btnSave.innerHTML = originalText;
      btnSave.disabled = false;
    }
  }

  async handleToggleStatus(e) {
    const button = e.currentTarget;
    const userId = button.getAttribute("data-id");
    const currentStatus = button.getAttribute("data-status") === "true";

    const actionText = currentStatus ? "bloquear" : "desbloquear";
    if (!confirm(`Tem certeza que deseja ${actionText} este usuário?`)) return;

    // Efeito de load no botãozinho pequeno
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast(`Usuário ${actionText}ado com sucesso.`, "success");
        this.fetchUsers();
      } else {
        this.showToast("Erro ao alterar status: " + result.error, "error");
        button.innerHTML = originalIcon;
      }
    } catch (error) {
      this.showToast("Falha de conexão ao tentar alterar o status.", "error");
      button.innerHTML = originalIcon;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminUsers();
});
