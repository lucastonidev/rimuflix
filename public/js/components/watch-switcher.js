import TorrentPlayer from "./torrent-player.js";

export class WatchSwitcher {
  constructor(players, type, id, tvParams) {
    this.players = players;
    this.type = type;
    this.id = id;
    this.tv = tvParams; // { currentSeason, currentEpisode }
    this.torrentPlayer = new TorrentPlayer();
  }

  updateFrameSrc(url) {
    let iframe = document.getElementById("watchFrame");
    if (!iframe) {
      const container =
        document.querySelector(".watch-player") ||
        document.getElementById("webtor-player")?.parentElement;
      if (container) {
        container.innerHTML =
          '<iframe id="watchFrame" allowfullscreen></iframe>';
        iframe = document.getElementById("watchFrame");
      }
    }
    if (iframe) iframe.src = url;
  }

  render() {
    const playerSwitcher = document.getElementById("playerSwitcher");
    if (!playerSwitcher) return;

    // Injeta o botão de Torrent nativo caso ele não venha da API de provedores
    const hasTorrent = this.players.some((p) => p.type === "Torrent");
    if (!hasTorrent) {
      this.players.push({
        title: "Torrent (P2P)",
        type: "Torrent",
        icon: '<i class="fa-solid fa-magnet" style="color: #3b82f6;"></i>',
      });
    }

    playerSwitcher.classList.add("player-switcher");
    playerSwitcher.innerHTML = `
      <div class="player-switcher__header" id="playerSwitcherHeader">
        <h3><i class="fa-solid fa-play"></i> Escolha um player</h3>
        <div class="player-switcher__header-right">
          <span class="player-switcher__hint">Troque se estiver lento</span>
          <i class="fa-solid fa-chevron-up player-switcher__toggle"></i>
        </div>
      </div>
      <div class="player-switcher__list-wrapper">
        <div class="player-switcher__list" id="playerSwitcherList"></div>
      </div>
    `;

    const listContainer = document.getElementById("playerSwitcherList");

    this.players.forEach((player, index) => {
      const btn = document.createElement("button");
      btn.className = `player-option ${index === 0 ? "active" : ""}`;

      // 👇 CORREÇÃO: Suporta tanto o formato antigo quanto o formato novo da base de dados
      const playerTitle = player.title || player.name || `Player ${index + 1}`;
      const playerUrl = player.url || player.embed;

      if (player.type === "Torrent") {
        btn.innerHTML = `
          <div class="player-option__icon" data-type="torrent" title="${playerTitle}">
            ${player.icon}
          </div>
          ${playerTitle}
        `;
        btn.dataset.url = "";
        btn.dataset.type = "torrent";
        listContainer.appendChild(btn);
        return;
      }

      // Renderiza os botões normais de Embed
      // Adicionado fallback de erro na imagem caso o URL do ícone esteja quebrado
      btn.innerHTML = `<img class="player-option__icon" src="${player.icon}" alt="${playerTitle}" onerror="this.outerHTML='<i class=\\'fa-solid fa-play\\'></i>'" /> ${playerTitle}`;
      btn.dataset.url = playerUrl; // <-- CORREÇÃO AQUI
      btn.dataset.type = "iframe";
      listContainer.appendChild(btn);
    });

    this.setupListeners();
  }

  setupListeners() {
    const header = document.getElementById("playerSwitcherHeader");
    const switcherContainer = document.getElementById("playerSwitcher");

    if (header && switcherContainer) {
      header.addEventListener("click", () => {
        switcherContainer.classList.toggle("collapsed");
      });
    }

    const playerOptions = document.querySelectorAll(".player-option");
    playerOptions.forEach((button) => {
      button.addEventListener("click", async () => {
        playerOptions.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        if (window.innerWidth <= 768 && switcherContainer) {
          switcherContainer.classList.add("collapsed");
        }

        if (button.dataset.type === "torrent") {
          await this.playTorrent();
          return;
        }

        const url = button.dataset.url;
        if (url) this.updateFrameSrc(url);
      });
    });
  }

  async playTorrent() {
    // 1. Define onde o menu/player vai aparecer
    const container =
      document.querySelector(".watch-player") ||
      document.getElementById("watchFrame")?.parentElement;

    if (!container) return;

    try {
      // 2. Mostra estado de carregamento inteligente na tela
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; background: #050505; color: var(--text-secondary); min-height: 400px;">
          <i class="fa-solid fa-magnet fa-beat-fade fa-3x" style="color: #3b82f6; margin-bottom: 20px;"></i>
          <h3 style="font-size: 1.2rem; color: #fff;">Buscando as melhores opções...</h3>
          <p style="font-size: 0.9rem; margin-top: 8px;">Isso pode levar alguns segundos.</p>
        </div>
      `;

      let url = `/api/v1/torrent/${this.type}/${this.id}`;
      if (this.type === "tv") {
        url += `?season=${this.tv.currentSeason}&episode=${this.tv.currentEpisode}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // 3. Validação caso não encontre nada
      if (!data.success || !data.data || data.data.length === 0) {
        container.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; background: #050505; color: #ef4444; min-height: 400px;">
            <i class="fa-solid fa-triangle-exclamation fa-3x" style="margin-bottom: 20px;"></i>
            <h3 style="color: #fff; margin-bottom: 10px;">Nenhum torrent encontrado.</h3>
            <p style="color: var(--text-secondary);">Tente usar os provedores normais no menu abaixo.</p>
          </div>
        `;
        return;
      }

      // 4. Inteligência: Ordena os torrents pelo número de Seeders (Semeadores) decrescente
      const torrentList = data.data.sort(
        (a, b) => (b.seeders || 0) - (a.seeders || 0),
      );

      // 5. Renderiza o Menu de Escolha
      this.renderTorrentMenu(torrentList, container);
    } catch (error) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; background: #050505; color: #ef4444; min-height: 400px;">
          <i class="fa-solid fa-wifi fa-3x" style="margin-bottom: 20px;"></i>
          <h3 style="color: #fff;">Erro de Conexão</h3>
          <p style="color: var(--text-secondary);">Falha ao buscar as opções de torrent.</p>
        </div>
      `;
    }
  }

  renderTorrentMenu(torrentList, container) {
    if (!container) return;

    let menuHtml = `
      <div class="torrent-mini-menu">
        <div class="torrent-mini-menu__header">
          <i class="fa-solid fa-magnet"></i>
          <h3>Escolha a Qualidade do Torrent</h3>
          <p>Recomendamos opções com mais <strong>Semeadores <i class="fa-solid fa-arrow-up"></i></strong> para carregar sem travar.</p>
        </div>
        <div class="torrent-mini-menu__list custom-scroll">
    `;

    torrentList.forEach((t) => {
      // Fallbacks para garantir que a interface não quebre se a API mudar
      const quality = t.quality || t.resolution || "Auto";
      const size = t.size || "-- GB";
      const seeders = t.seeders || t.seeds || 0;

      // Inteligência de cores: Verde (Rápido), Amarelo (Médio), Vermelho (Lento/Morto)
      const healthColor =
        seeders > 40 ? "#10b981" : seeders > 10 ? "#f59e0b" : "#ef4444";

      menuHtml += `
        <button class="torrent-file-btn" data-magnet="${t.magnet}">
          <div class="torrent-file-btn__quality">${quality}</div>
          <div class="torrent-file-btn__info">
            <span title="Tamanho do Arquivo"><i class="fa-solid fa-hard-drive"></i> ${size}</span>
            <span title="Semeadores Ativos" style="color: ${healthColor};"><i class="fa-solid fa-arrow-up"></i> ${seeders}</span>
          </div>
        </button>
      `;
    });

    menuHtml += `
        </div>
      </div>
    `;

    container.innerHTML = menuHtml;

    // Escuta o clique nas qualidades para iniciar o Webtor
    const buttons = container.querySelectorAll(".torrent-file-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const magnet = btn.getAttribute("data-magnet");

        container.innerHTML =
          '<div id="webtor-player" class="watchTorrent"></div>';
        try {
          await this.torrentPlayer.start(magnet, "webtor-player");
        } catch (err) {
          alert(
            "Ocorreu um erro ao tentar reproduzir o Torrent. Tente outra qualidade.",
          );
          // Se falhar, renderiza o menu de novo para o usuário não ficar preso numa tela preta
          this.renderTorrentMenu(torrentList, container);
        }
      });
    });
  }
}
