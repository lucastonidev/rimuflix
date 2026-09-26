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

      if (player.type === "Torrent") {
        btn.innerHTML = `
          <div class="player-option__icon" data-type="${player.title.toLowerCase()}" title="${player.title}">${player.icon}</div>
          ${player.title}
        `;
        btn.dataset.url = "";
        btn.dataset.type = "torrent";
        listContainer.appendChild(btn);
        return;
      }

      btn.innerHTML = `<img class="player-option__icon" src="${player.icon}" alt="${player.title}" /> ${player.title}`;
      btn.dataset.url = player.embed;
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
    try {
      let url = `/api/v1/torrent/${this.type}/${this.id}`;
      if (this.type === "tv")
        url += `?season=${this.tv.currentSeason}&episode=${this.tv.currentEpisode}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success || !data.data || data.data.length === 0) {
        alert("Nenhum torrent encontrado.");
        return;
      }

      const torrentList = data.data;
      let currentIndex = 0;

      const tryNextTorrent = async () => {
        if (currentIndex >= torrentList.length) {
          alert("Todos os torrents disponíveis falharam.");
          return;
        }

        const torrent = torrentList[currentIndex];
        const container =
          document.querySelector(".watch-player") ||
          document.getElementById("watchFrame")?.parentElement;

        if (container) {
          container.innerHTML =
            '<div id="webtor-player" class="watchTorrent"></div>';
          try {
            await this.torrentPlayer.start(torrent.magnet, "webtor-player");
          } catch (err) {
            currentIndex++;
            await tryNextTorrent();
          }
        }
      };

      await tryNextTorrent();
    } catch (error) {
      alert("Erro ao buscar as opções de torrent.");
    }
  }
}
