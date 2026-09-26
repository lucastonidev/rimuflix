class AdminUsers {
  constructor() {
    this.tableBody = document.getElementById("users-table-body");
    this.footerCount = document.getElementById("users-count-footer");

    // 👇 Captura o formulário
    this.formAddUser = document.getElementById("form-add-user");

    this.init();
  }

  async init() {
    await this.fetchUsers();
    this.setupListeners(); // 👇 Inicia os ouvintes
  }

  setupListeners() {
    // 👇 Escuta o envio do form
    if (this.formAddUser) {
      this.formAddUser.addEventListener("submit", (e) =>
        this.handleCreateUser(e),
      );
    }
  }

  // 👇 Nova função para enviar os dados para a API
  async handleCreateUser(e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById("user_name").value.trim(),
      email: document.getElementById("user_email").value.trim(),
      password: "defaultpassword", // Senha padrão para novos usuários
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
        alert("Usuário criado com sucesso!");
        this.formAddUser.reset(); // Limpa os inputs
        this.fetchUsers(); // Atualiza a tabela na mesma hora
      } else {
        alert("Erro ao cadastrar: " + result.error);
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert("Falha na comunicação com o servidor.");
    }
  }

  async fetchUsers() {
    try {
      const response = await fetch("/api/v1/admin/users");
      const result = await response.json();

      if (result.success) {
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
    this.tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">${message}</td></tr>`;
  }

  // Pega as duas primeiras letras do nome para criar um "Avatar" improvisado
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
      this.tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum usuário cadastrado ainda.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = users
      .map((user) => {
        // Cores para o avatar baseadas no nome
        const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
        const colorIndex = user.name
          ? user.name.charCodeAt(0) % colors.length
          : 0;
        const avatarColor = colors[colorIndex];

        const statusHtml = user.is_active
          ? `<div class="status-cell"><div class="status-dot"></div> Ativo</div>`
          : `<div class="status-cell" style="color: var(--text-secondary);"><div class="status-dot" style="background-color: var(--text-secondary);"></div> Bloqueado</div>`;

        const actionBtn = user.is_active
          ? `<button class="btn btn-outline toggle-status-btn" data-id="${user.id}" data-status="true" style="padding: 6px 12px; font-size: 0.75rem;"><i class="fa-solid fa-ban" style="color: #ef4444;"></i> Bloquear</button>`
          : `<button class="btn btn-outline toggle-status-btn" data-id="${user.id}" data-status="false" style="padding: 6px 12px; font-size: 0.75rem;"><i class="fa-solid fa-check" style="color: #10b981;"></i> Desbloquear</button>`;

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
                ${user.role === "admin" ? '<span class="user-role">Admin</span>' : ""}
              </div>
            </div>
          </td>
          <td style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary);">${user.id}</td>
          <td>${this.formatDate(user.created_at)}</td>
          <td>${statusHtml}</td>
          <td style="text-align: right;">${actionBtn}</td>
        </tr>
      `;
      })
      .join("");

    // Adiciona os eventos de clique nos botões de Bloquear/Desbloquear
    document.querySelectorAll(".toggle-status-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleToggleStatus(e));
    });
  }

  async handleToggleStatus(e) {
    const button = e.currentTarget;
    const userId = button.getAttribute("data-id");
    const currentStatus = button.getAttribute("data-status") === "true";

    const actionText = currentStatus ? "bloquear" : "desbloquear";
    if (!confirm(`Tem certeza que deseja ${actionText} este usuário?`)) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        // Recarrega a tabela para mostrar o novo status
        this.fetchUsers();
      } else {
        alert("Erro ao alterar status: " + result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha de conexão ao tentar alterar o status.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminUsers();
});
