export function renderPlayerSwitcher(players, videoWrapper, livePlayerIframe) {
  let switcherContainer = document.getElementById("livetv-player-switcher");

  if (players.length === 0) {
    if (switcherContainer) switcherContainer.remove();
    return;
  }

  if (!switcherContainer) {
    switcherContainer = document.createElement("div");
    switcherContainer.id = "livetv-player-switcher";
    switcherContainer.className = "player-switcher";
    videoWrapper.appendChild(switcherContainer);
  }

  let buttonsHtml = players
    .map(
      (player, index) => `
    <button class="player-option ${index === 0 ? "active" : ""}" data-url="${player.url}">
      <i class="fa-solid fa-server"></i> ${player.title}
    </button>
  `,
    )
    .join("");

  switcherContainer.innerHTML = `
    <div class="player-switcher__header">
      <h3><i class="fa-solid fa-rotate"></i> Trocar Player</h3>
    </div>
    <div class="player-switcher__list">
      ${buttonsHtml}
    </div>
  `;

  const btns = switcherContainer.querySelectorAll(".player-option");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      livePlayerIframe.src = btn.getAttribute("data-url");
    });
  });
}
