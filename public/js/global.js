// public/js/global.js

class GlobalApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupTabSync();
    // Aqui no futuro você pode colocar:
    // this.setupTheme();
    // this.setupGlobalToasts();
  }

  /**
   * Mantém o estado de login sincronizado entre várias abas abertas
   */
  setupTabSync() {
    window.addEventListener("storage", (event) => {
      // Observa especificamente a chave do usuário da Rimuflix
      if (event.key === "rimuflix:user") {
        // Se a chave sumiu (o usuário clicou em Sair em outra aba)
        if (!event.newValue) {
          console.warn("Sessão encerrada em outra aba.");
          // Redireciona para o login
          window.location.href = "/login";
        }
        // Se a chave apareceu/mudou (o usuário fez Login em outra aba)
        else if (event.newValue && !event.oldValue) {
          console.info("Novo login detectado em outra aba. Atualizando...");
          // Recarrega a página atual para ela atualizar o Header e o conteúdo
          window.location.reload();
        }
      }
    });
  }
}

// Inicializa a classe assim que o arquivo for carregado
document.addEventListener("DOMContentLoaded", () => {
  new GlobalApp();
});
