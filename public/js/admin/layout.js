document.addEventListener("DOMContentLoaded", () => {
  const btnMenu = document.getElementById("btn-mobile-menu");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (btnMenu && sidebar && overlay) {
    // Abrir menu
    btnMenu.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("active");
    });

    // Fechar menu ao clicar no overlay escuro
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });

    // Fechar menu ao clicar no botão de fechar
    btnCloseSidebar.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
});
