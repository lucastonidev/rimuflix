class HeaderMenu {
  constructor() {
    this.btnMenu = document.getElementById("user-menu-btn");
    this.dropdown = document.getElementById("user-dropdown");
    this.adminLink = document.getElementById("dropdown-admin-link");
    this.settingsLink = document.getElementById("dropdown-settings-link"); // NOVO AQUI
    this.usernameLabel = document.getElementById("dropdown-username");
    this.roleLabel = document.getElementById("dropdown-role");
    this.btnLogout = document.getElementById("btn-logout");
    this.headerAvatar = document.getElementById("header-user-avatar");
    this.mobileMenuBtn = document.getElementById("mobile-menu-btn");
    this.mobileCloseBtn = document.getElementById("mobile-close-btn");
    this.headerNav = document.getElementById("header-nav");

    this.user = JSON.parse(localStorage.getItem("rimuflix:user")) || null;
    this.init();
  }

  async init() {
    if (!this.btnMenu || !this.dropdown) return;

    // 1. Confirma com o servidor se a sessão é real
    await this.checkSession();

    // 2. Atualiza os botões (mostra/esconde Admin)
    this.updateUserInterface();

    // 3. Prepara os cliques do menu
    this.setupListeners();
  }

  async checkSession() {
    try {
      const response = await fetch("/api/v1/auth/me");
      const result = await response.json();

      if (result.success && result.data) {
        // O servidor confirmou que o cookie é válido e retornou o usuário!
        this.user = result.data;

        // Atualiza o localStorage para manter tudo sincronizado
        localStorage.setItem("rimuflix:user", JSON.stringify(result.data));
        localStorage.setItem("rimuflix:userId", result.data.id);
      } else {
        // O servidor disse que não há sessão (cookie expirado ou ausente)
        this.user = null;

        // Limpa o localStorage forçadamente, pois a sessão acabou
        localStorage.removeItem("rimuflix:user");
        localStorage.removeItem("rimuflix:userId");
      }
    } catch (error) {
      console.error("Erro ao verificar sessão com o backend:", error);
    }
  }

  updateUserInterface() {
    if (!this.user) {
      // ---- LÓGICA DE VISITANTE ----
      this.usernameLabel.textContent = "Visitante";
      this.roleLabel.textContent = "";

      if (this.btnLogout) {
        this.btnLogout.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Entrar`;
        this.btnLogout.classList.remove("text-danger");
      }
      if (this.adminLink) this.adminLink.style.display = "none";
      if (this.settingsLink) this.settingsLink.style.display = "none";

      // Reseta a foto para o ícone padrão
      if (this.headerAvatar) {
        this.headerAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
        this.headerAvatar.style.border = "none";
      }
      return;
    }

    // ---- LÓGICA DE USUÁRIO LOGADO ----
    this.usernameLabel.textContent = this.user.name || "Usuário";

    if (this.settingsLink) this.settingsLink.style.display = "flex";

    if (this.user.role === "admin") {
      this.roleLabel.textContent = "Administrador";
      if (this.adminLink) this.adminLink.style.display = "flex";
    } else {
      this.roleLabel.textContent = "Membro";
      if (this.adminLink) this.adminLink.style.display = "none";
    }

    // 🚨 LÓGICA DO AVATAR NO HEADER
    if (this.headerAvatar) {
      if (this.user.avatar_url && this.user.avatar_url.trim() !== "") {
        // Se tem foto no banco/localStorage, coloca a tag <img>
        this.headerAvatar.innerHTML = `<img src="${this.user.avatar_url}" alt="Perfil" style="width: 100%; height: 100%; object-fit: cover;">`;
        this.headerAvatar.style.border = "2px solid var(--accent)"; // Uma bordinha bonita
      } else {
        // Se não tem foto, pega a primeira letra do nome (ex: "J" de João)
        const initial = (this.user.name || "U").charAt(0).toUpperCase();
        this.headerAvatar.innerHTML = initial;
        this.headerAvatar.style.border = "2px solid transparent";
      }
    }
  }

  setupListeners() {
    // Abre/fecha o menu ao clicar na foto
    this.btnMenu.addEventListener("click", (e) => {
      e.stopPropagation(); // Evita que o clique feche imediatamente
      this.dropdown.classList.toggle("hidden");
      setTimeout(() => {
        this.dropdown.classList.toggle("active");
      }, 10);
    });

    // Clicar fora do menu fecha ele
    document.addEventListener("click", (e) => {
      if (
        !this.dropdown.contains(e.target) &&
        !this.btnMenu.contains(e.target)
      ) {
        this.dropdown.classList.remove("active");
        setTimeout(() => {
          this.dropdown.classList.add("hidden");
        }, 300);
      }
    });

    // Lógica do botão Entrar/Sair
    if (this.btnLogout) {
      this.btnLogout.addEventListener("click", async () => {
        if (this.user) {
          await fetch("/api/v1/auth/logout", { method: "POST" });

          localStorage.removeItem("rimuflix:user");
          localStorage.removeItem("rimuflix:userId");
          window.location.reload();
        } else {
          window.location.href =
            "/login?continue=" + encodeURIComponent(window.location.href);
        }
      });
    }

    // Adicione no início do método setupListeners():
    if (this.mobileMenuBtn && this.headerNav) {
      this.mobileMenuBtn.addEventListener("click", () => {
        this.headerNav.classList.add("active");
      });
    }

    if (this.mobileCloseBtn && this.headerNav) {
      this.mobileCloseBtn.addEventListener("click", () => {
        this.headerNav.classList.remove("active");
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new HeaderMenu();
});
