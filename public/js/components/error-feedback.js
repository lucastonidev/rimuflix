export function createErrorState(
  message = "Ops, ocorreu um erro inesperado.",
  retryCallback = null,
) {
  const container = document.createElement("div");
  container.className = "error-feedback";

  // Usando CSS in-line por conveniência, mas você pode mover para o components.css depois
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--text-secondary);
    width: 100%;
    grid-column: 1 / -1; /* Caso seja usado dentro de um grid */
  `;

  let html = `
    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3.5rem; color: var(--accent); margin-bottom: 16px;"></i>
    <h3 style="font-size: 1.5rem; color: var(--text-primary); margin-bottom: 8px;">Algo deu errado</h3>
    <p style="margin-bottom: 24px; max-width: 400px;">${message}</p>
  `;

  // Adiciona o botão de tentar novamente APENAS se uma função de callback for enviada
  if (retryCallback) {
    html += `<button class="btn-primary" id="btn-retry-error"><i class="fa-solid fa-rotate-right"></i> Tentar Novamente</button>`;
  }

  container.innerHTML = html;

  // Escuta o clique do botão caso ele exista
  if (retryCallback) {
    container
      .querySelector("#btn-retry-error")
      .addEventListener("click", retryCallback);
  }

  return container;
}
