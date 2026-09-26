export default class Settings {
  constructor() {
    this.elementDom = {
      avatarPreview: document.getElementById("avatar-preview"),
      avatarUpload: document.getElementById("avatar-upload"),
      usernameInput: document.getElementById("username"),
      emailInput: document.getElementById("email"),
      passwordInput: document.getElementById("password"), // <-- Novo
      profileForm: document.getElementById("profile-form"),
      btnSave: document.getElementById("btn-save"),
      statusMessage: document.getElementById("status-message"),
    };

    this.currentUser = JSON.parse(localStorage.getItem("rimuflix:user")) || {
      name: "Visitante",
      email: "",
      avatar_url: "",
    };

    this.selectedAvatarFile = null;
    this.isLoggedIn = false;

    this.init();
  }

  async init() {
    await this.checkSession();
    this.updateUI();
    this.setupListeners();
  }

  async checkSession() {
    try {
      const response = await fetch("/api/v1/auth/me", {
        credentials: "same-origin",
      });
      const result = await response.json();

      if (result.success && result.data) {
        this.isLoggedIn = true;
        this.currentUser = result.data;
        localStorage.setItem("rimuflix:user", JSON.stringify(result.data));
      } else {
        this.isLoggedIn = false;
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      this.isLoggedIn = false;
    }
  }

  updateUI() {
    if (this.elementDom.usernameInput)
      this.elementDom.usernameInput.value = this.currentUser.name || "";
    if (this.elementDom.emailInput)
      this.elementDom.emailInput.value = this.currentUser.email || "";

    if (!this.isLoggedIn) {
      if (this.elementDom.emailInput) {
        this.elementDom.emailInput.disabled = true;
        this.elementDom.emailInput.placeholder = "Indisponível para visitantes";
      }
      if (this.elementDom.passwordInput) {
        this.elementDom.passwordInput.disabled = true;
        this.elementDom.passwordInput.placeholder =
          "Indisponível para visitantes";
      }
      if (this.elementDom.avatarUpload) {
        this.elementDom.avatarUpload.disabled = true;
      }
    }

    if (this.currentUser.avatar_url) {
      this.elementDom.avatarPreview.innerHTML = `<img src="${this.currentUser.avatar_url}" alt="Avatar">`;
      this.elementDom.avatarPreview.style.borderColor = "var(--accent)";
    } else {
      const initial = (this.currentUser.name || "U").charAt(0).toUpperCase();
      this.elementDom.avatarPreview.innerHTML = initial;
      this.elementDom.avatarPreview.style.borderColor = "var(--border-color)";
    }
  }

  setupListeners() {
    if (this.elementDom.avatarUpload) {
      this.elementDom.avatarUpload.onchange = (e) => this.handleAvatarUpload(e);
    }
    if (this.elementDom.profileForm) {
      this.elementDom.profileForm.onsubmit = (e) => this.handleSubmit(e);
    }
  }

  handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      this.showMessage("Formato inválido. Use JPEG, PNG ou WEBP.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.showMessage(
        "A imagem é muito grande. Escolha uma de até 2MB.",
        "error",
      );
      e.target.value = "";
      return;
    }

    this.selectedAvatarFile = file;

    const reader = new FileReader();
    reader.onload = (event) => {
      this.elementDom.avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Novo Avatar">`;
      this.elementDom.avatarPreview.style.borderColor = "var(--accent)";
    };
    reader.readAsDataURL(file);
  }

  sanitizeInput(str) {
    if (!str) return "";
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    };
    const reg = /[&<>"'`=\/]/gi;
    return str.replace(reg, (match) => map[match]);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const rawName = this.elementDom.usernameInput.value.trim();
    const rawEmail = this.elementDom.emailInput
      ? this.elementDom.emailInput.value.trim()
      : "";
    const rawPassword = this.elementDom.passwordInput
      ? this.elementDom.passwordInput.value.trim()
      : "";

    const safeName = this.sanitizeInput(rawName);
    const safeEmail = this.sanitizeInput(rawEmail);

    if (!safeName) {
      this.showMessage("O nome de usuário não pode estar vazio.", "error");
      return;
    }

    // Se a pessoa preencheu a senha, fazemos uma validação visual básica
    if (rawPassword && rawPassword.length < 6) {
      this.showMessage(
        "A nova senha deve ter pelo menos 6 caracteres.",
        "error",
      );
      return;
    }

    this.setLoading(true);

    if (!this.isLoggedIn) {
      this.currentUser.name = safeName;
      localStorage.setItem("rimuflix:user", JSON.stringify(this.currentUser));
      this.updateUI();
      this.showMessage("Nome atualizado localmente com sucesso!", "success");
      this.setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", safeName);
    if (safeEmail) formData.append("email", safeEmail);
    if (rawPassword) formData.append("password", rawPassword); // Envia só se preencheu
    if (this.selectedAvatarFile)
      formData.append("avatar", this.selectedAvatarFile);

    try {
      const response = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = { ...this.currentUser, ...result.data };
        localStorage.setItem("rimuflix:user", JSON.stringify(this.currentUser));
        this.selectedAvatarFile = null;

        // Limpa o campo de senha após atualizar com sucesso
        if (this.elementDom.passwordInput)
          this.elementDom.passwordInput.value = "";

        this.showMessage("Perfil atualizado com sucesso!", "success");
      } else {
        // Mostra o erro exato do banco (ex: senha bloqueada ou email já existente)
        this.showMessage(
          "Falha: " + (result.error || "Tente novamente."),
          "error",
        );
      }
    } catch (error) {
      console.error("Erro na comunicação com a API:", error);
      this.showMessage("Erro de conexão ao salvar no servidor.", "error");
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(isLoading) {
    if (!this.elementDom.btnSave) return;
    if (isLoading) {
      this.originalBtnText = this.elementDom.btnSave.innerHTML;
      this.elementDom.btnSave.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
      this.elementDom.btnSave.disabled = true;
    } else {
      this.elementDom.btnSave.innerHTML =
        this.originalBtnText ||
        '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';
      this.elementDom.btnSave.disabled = false;
    }
  }

  showMessage(msg, type = "success", timeout = 3500) {
    if (!this.elementDom.statusMessage) return;
    this.elementDom.statusMessage.textContent = msg;
    this.elementDom.statusMessage.className = `message ${type}`;
    this.elementDom.statusMessage.style.display = "block";

    setTimeout(() => {
      this.elementDom.statusMessage.style.display = "none";
    }, timeout);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Settings();
});
