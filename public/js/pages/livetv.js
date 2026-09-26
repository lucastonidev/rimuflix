import {
  renderCategoryMenu,
  renderChannelList,
} from "../components/livetv-sidebar.js";
import { renderPlayerSwitcher } from "../components/livetv-switcher.js";
import { updateEPG } from "../components/livetv-epg.js";

class LiveTV {
  constructor() {
    this.allChannels = [];
    this.categories = [];
    this.currentCategoryChannels = [];
    this.currentChannelIndex = 0;

    this.elements = {
      sidebarHeader: document.querySelector(".category-header"),
      channelList: document.getElementById("channelList"),
      livePlayer: document.getElementById("livePlayer"),
      videoWrapper: document.querySelector(".video-wrapper"),
      epgChannelName: document.getElementById("epgChannelName"),
      epgList: document.getElementById("epgList"),

      mobileView: document.getElementById("mobilePlayerView"),
      closeMobileBtn: document.getElementById("closeMobilePlayer"),
      mobileVideoSlot: document.getElementById("mobileVideoContainerSlot"),
      mobileEpgSlot: document.getElementById("mobileEpgSlot"),
      desktopVideoContainer: document.getElementById("desktopVideoContainer"),
      desktopEpgContainer: document.getElementById("desktopEpgContainer"),
    };
  }

  async init() {
    this.setupGlobalEventListeners();

    try {
      const [channelsRes, categoriesRes] = await Promise.all([
        fetch("/api/v1/livetv").then((res) => res.json()),
        fetch("/api/v1/livetv/categories").then((res) => res.json()),
      ]);

      if (channelsRes.success) this.allChannels = channelsRes.data;

      if (categoriesRes.success && categoriesRes.data) {
        const rawCats = categoriesRes.data;
        this.categories = Array.isArray(rawCats)
          ? rawCats
          : rawCats.canais ||
            rawCats.results ||
            rawCats.data ||
            Object.values(rawCats) ||
            [];
      }

      if (
        !this.categories ||
        !Array.isArray(this.categories) ||
        this.categories.length === 0
      ) {
        const cats = new Set(
          this.allChannels.map(
            (ch) => ch.categoria || ch.category || ch.grupo || "TV Aberta",
          ),
        );
        this.categories = Array.from(cats).map((c) => ({
          name: c,
          categoria: c,
        }));
      }

      this.showCategories();
    } catch (error) {
      console.error("Erro ao inicializar TV:", error);
      this.elements.channelList.innerHTML = `<div style="text-align:center; padding:20px; color:#ff6b6b;">Erro de conexão ao carregar a TV.</div>`;
    }
  }

  setupGlobalEventListeners() {
    if (this.elements.closeMobileBtn) {
      this.elements.closeMobileBtn.addEventListener("click", () =>
        this.closeMobilePlayer(),
      );
    }
    window.addEventListener("resize", () => {
      if (
        window.innerWidth >= 768 &&
        !this.elements.mobileView.classList.contains("hidden")
      ) {
        this.closeMobilePlayer();
      }
    });
  }

  showCategories() {
    renderCategoryMenu(
      this.categories,
      this.elements.sidebarHeader,
      this.elements.channelList,
      (catName) => this.showChannels(catName),
    );
  }

  showChannels(categoryName) {
    this.currentCategoryChannels = this.allChannels.filter((ch) => {
      const cName = ch.categoria || ch.category || ch.grupo || "TV Aberta";
      return cName === categoryName;
    });
    this.currentChannelIndex = 0;

    renderChannelList(
      this.currentCategoryChannels,
      this.elements.sidebarHeader,
      this.elements.channelList,
      {
        onMenuClick: () => this.showCategories(),
        onNavigate: (dir) => this.navigateChannels(dir),
        onChannelSelect: (ch, index, el) => this.selectChannel(ch, index, el),
      },
    );
  }

  navigateChannels(direction) {
    if (this.currentCategoryChannels.length === 0) return;

    this.currentChannelIndex += direction;
    if (this.currentChannelIndex < 0)
      this.currentChannelIndex = this.currentCategoryChannels.length - 1;
    else if (this.currentChannelIndex >= this.currentCategoryChannels.length)
      this.currentChannelIndex = 0;

    const nextChannel = this.currentCategoryChannels[this.currentChannelIndex];
    const htmlItems =
      this.elements.channelList.querySelectorAll(".channel-item");
    const targetHtmlItem = htmlItems[this.currentChannelIndex];

    this.selectChannel(nextChannel, this.currentChannelIndex, targetHtmlItem);
    targetHtmlItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  selectChannel(channel, index, htmlElement) {
    this.currentChannelIndex = index;
    const extractedPlayers = channel.extractedPlayers || [];

    document
      .querySelectorAll(".channel-item")
      .forEach((el) => el.classList.remove("active"));
    if (htmlElement) htmlElement.classList.add("active");

    this.elements.livePlayer.src =
      extractedPlayers.length > 0 ? extractedPlayers[0].url : "";

    updateEPG(channel, this.elements.epgChannelName, this.elements.epgList);
    renderPlayerSwitcher(
      extractedPlayers,
      this.elements.videoWrapper,
      this.elements.livePlayer,
    );

    if (window.innerWidth < 768) this.openMobilePlayer();
  }

  // --- MOBILE LOGIC ---
  openMobilePlayer() {
    this.elements.mobileVideoSlot.appendChild(
      this.elements.desktopVideoContainer,
    );
    const switcher = document.getElementById("livetv-player-switcher");
    if (switcher) this.elements.mobileVideoSlot.appendChild(switcher);

    this.elements.mobileEpgSlot.appendChild(this.elements.epgChannelName);
    this.elements.mobileEpgSlot.appendChild(this.elements.epgList);

    this.elements.mobileView.classList.remove("hidden");
    setTimeout(() => this.elements.mobileView.classList.add("active"), 10);
  }

  closeMobilePlayer() {
    this.elements.mobileView.classList.remove("active");
    setTimeout(() => {
      this.elements.mobileView.classList.add("hidden");
      this.elements.videoWrapper.appendChild(
        this.elements.desktopVideoContainer,
      );
      const switcher = document.getElementById("livetv-player-switcher");
      if (switcher) this.elements.videoWrapper.appendChild(switcher);

      this.elements.desktopEpgContainer.appendChild(
        this.elements.epgChannelName,
      );
      this.elements.desktopEpgContainer.appendChild(this.elements.epgList);
    }, 300);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const liveTv = new LiveTV();
  liveTv.init();
});