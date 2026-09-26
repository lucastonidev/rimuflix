class LoginManager {
  constructor() {
    this.form = document.getElementById("login-form");
    this.input = document.getElementById("name");
    this.passwordInput = document.getElementById("password"); // Captura do input de senha
    this.btnSubmit = document.getElementById("btn-submit");
    this.errorBox = document.getElementById("login-error");
    this.params = new URLSearchParams(window.location.search);

    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    if (this.params.has("error")) {
      this.handleUrlErrors(this.params.get("error"));
    }
  }

  handleUrlErrors(errorType) {
    switch (errorType) {
      case "auth_required":
        this.showError("Você precisa fazer login para acessar este conteúdo.");
        break;
      case "session_expired":
        this.showError("Sua sessão expirou. Por favor, faça login novamente.");
        break;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.hideError();
    this.setLoading(true);

    const inputValue = this.input.value.trim();
    const passwordValue = this.passwordInput.value; // Extração do valor da senha

    if (!inputValue || !passwordValue) {
      this.showError("Preencha todos os campos.");
      this.setLoading(false);
      return;
    }

    const isEmail = inputValue.includes("@");

    // Inclusão da senha no payload final
    const payload = isEmail
      ? { email: inputValue, password: passwordValue }
      : { username: inputValue, password: passwordValue };

    try {
      const response = await this.authenticate(payload);

      if (response.success) {
        this.handleSuccess(response.data);
      } else {
        this.showError(response.error || "Ocorreu um erro ao fazer login.");
        this.passwordInput.value = "";
      }
    } catch (error) {
      this.showError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      this.setLoading(false);
    }
  }

  async authenticate(payload) {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  handleSuccess(data) {
    localStorage.setItem("rimuflix:user", JSON.stringify(data));
    localStorage.setItem("rimuflix:userId", data.id);

    if (this.params.has("continue")) {
      window.location.href = decodeURIComponent(this.params.get("continue"));
    } else {
      window.location.href = "/";
    }
  }

  showError(msg) {
    this.errorBox.textContent = msg;
    this.errorBox.classList.remove("hidden");
  }

  hideError() {
    this.errorBox.classList.add("hidden");
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.btnSubmit.disabled = true;
      this.btnSubmit.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
    } else {
      this.btnSubmit.disabled = false;
      this.btnSubmit.innerHTML = "Entrar";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LoginManager();
});
