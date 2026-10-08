import {
  saveWatchProgress,
  autoSaveLocalProgress,
  getWatchProgressState,
} from "./watch-progress.js";

export class TimeTracker {
  constructor(mediaData) {
    this.media = mediaData;
    this.secondsActive = 0;
    this.interval = null;

    this.init();
  }

  async init() {
    // 1. Busca o histórico de progresso (Local ou Nuvem)
    const progressList = await getWatchProgressState();

    // 2. Filtra para achar o episódio/filme atual
    const savedProgress = progressList.find(
      (p) =>
        String(p.tmdbId) === String(this.media.id) &&
        (this.media.type === "movie" ||
          (p.seasonNumber == this.media.season &&
            p.episodeNumber == this.media.episode)),
    );

    // 3. Se achou um tempo salvo, converte de HH:MM:SS para segundos totais
    if (savedProgress && savedProgress.stoppedAt) {
      const parts = savedProgress.stoppedAt.split(":");
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parseInt(parts[2], 10);
        this.secondsActive = h * 3600 + m * 60 + s;
      }
    }

    this.injectCard();
    this.injectModal();

    // 4. Se tiver um tempo prévio, injeta o card de aviso abaixo do player
    if (this.secondsActive > 0) {
      this.injectResumeBanner(this.formatTime(this.secondsActive).string);
    }

    this.startTimer();
    this.setupListeners();
  }

  startTimer() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.secondsActive++;
      this.updateDisplay();

      if (this.secondsActive % 10 === 0) {
        this.triggerLocalAutoSave();
      }
    }, 1000);
  }

  pauseTimer() {
    clearInterval(this.interval);
    this.interval = null;
    this.triggerLocalAutoSave();
  }

  formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return { h, m, s, string: `${h}:${m}:${s}` };
  }

  updateDisplay() {
    const display = document.getElementById("tracker-time-display");
    if (display) {
      display.textContent = this.formatTime(this.secondsActive).string;
    }
  }

  triggerLocalAutoSave() {
    autoSaveLocalProgress({
      tmdbId: this.media.id,
      mediaType: this.media.type,
      seasonNumber: this.media.season,
      episodeNumber: this.media.episode,
      stoppedAt: this.formatTime(this.secondsActive).string,
    });
  }

  injectCard() {
    const cardHtml = `
      <div class="container time-tracker-wrapper">
        <div id="time-tracker-card" class="time-tracker-card">
          <div class="tracker-content-left">
            <div class="tracker-icon-box">
              <i class="fa-solid fa-stopwatch"></i>
            </div>
            <div class="tracker-texts">
              <h3>Progresso de Sessão</h3>
              <p>
                Calculamos o tempo que você assiste e <strong>salvamos localmente de forma automática</strong>. 
                Sincronize com a nuvem para não perder o progresso caso mude de dispositivo.
              </p>
            </div>
          </div>
          <div class="tracker-content-right">
            <div class="tracker-timer">
              <span class="timer-label" style="margin-bottom: 4px;">Tempo Assistido</span>
              <strong id="tracker-time-display">${this.formatTime(this.secondsActive).string}</strong>
            </div>
            <button id="btn-save-cloud" class="btn-tracker" title="Confirmar e Salvar na Nuvem">
              <i class="fa-solid fa-cloud-arrow-up"></i> Salvar na Nuvem
            </button>
          </div>
        </div>
      </div>
    `;

    const menuContainer = document.querySelector(".menu-container");
    const watchPlayer = document.querySelector(".watch-player");
    const playerContainer = document.querySelector(".player-container");

    if (menuContainer) {
      menuContainer.insertAdjacentHTML("afterend", cardHtml);
    } else if (watchPlayer) {
      watchPlayer.insertAdjacentHTML("afterend", cardHtml);
    } else if (playerContainer) {
      playerContainer.insertAdjacentHTML("afterend", cardHtml);
    } else {
      document.body.insertAdjacentHTML("beforeend", cardHtml);
    }
  }

  injectResumeBanner(timeString) {
    // Evita duplicar se recarregar algo na mesma página
    const existing = document.getElementById("resume-progress-banner");
    if (existing) existing.remove();

    const resumeHtml = `
      <div id="resume-progress-banner" class="resume-progress-banner">
        <div class="resume-card-inner">
          <div class="resume-text">
            <div class="resume-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="resume-info">
               <span class="resume-title">Continuar de onde parou</span>
               <span class="resume-desc">Sua última sessão foi salva em <strong>${timeString}</strong>. Avance o player para este momento.</span>
            </div>
          </div>
          <button id="btn-dismiss-resume" title="Entendi"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;

    const menuContainer = document.querySelector(".menu-container");
    const watchPlayer = document.querySelector(".watch-player");

    if (menuContainer) {
      menuContainer.insertAdjacentHTML("afterend", resumeHtml);
    } else if (watchPlayer) {
      watchPlayer.insertAdjacentHTML("afterend", resumeHtml);
    }

    // Lógica para fechar o card
    document
      .getElementById("btn-dismiss-resume")
      ?.addEventListener("click", (e) => {
        e.currentTarget.closest("#resume-progress-banner").remove();
      });
  }

  injectModal() {
    const modalHtml = `
      <div id="time-tracker-modal" class="tracker-modal-overlay">
        <div class="tracker-modal-box">
          <div class="tracker-modal-header">
            <h3 class="tracker-modal-title"><i class="fa-solid fa-cloud-arrow-up"></i> Salvar na Nuvem</h3>
            <button id="close-tracker-modal" class="tracker-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="tracker-modal-body" style="text-align: left;">
            <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem; line-height: 1.5;">
              <strong>Confirme ou ajuste o tempo antes de salvar.</strong><br>
              Caso tenha esquecido a aba aberta ou já assistido parte do episódio em outro lugar, ajuste o cronômetro para marcar o momento exato em que parou.
            </p>
            <div class="tracker-inputs">
              <div class="form-group">
                <label class="form-label">Horas</label>
                <input type="number" id="track-h" class="form-control" min="0" max="10" value="00">
              </div>
              <div class="form-group">
                <label class="form-label">Minutos</label>
                <input type="number" id="track-m" class="form-control" min="0" max="59" value="00">
              </div>
              <div class="form-group">
                <label class="form-label">Segundos</label>
                <input type="number" id="track-s" class="form-control" min="0" max="59" value="00">
              </div>
            </div>
            <button id="btn-confirm-cloud-save" class="tracker-btn-submit">
              Confirmar e Salvar
            </button>
          </div>
        </div>
      </div>
    `;
    if (!document.getElementById("time-tracker-modal")) {
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }
  }

  setupListeners() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseTimer();
      else this.startTimer();
    });

    const modal = document.getElementById("time-tracker-modal");

    document.getElementById("btn-save-cloud")?.addEventListener("click", () => {
      const time = this.formatTime(this.secondsActive);
      document.getElementById("track-h").value = time.h;
      document.getElementById("track-m").value = time.m;
      document.getElementById("track-s").value = time.s;
      modal.classList.add("active");
    });

    document
      .getElementById("close-tracker-modal")
      ?.addEventListener("click", () => {
        modal.classList.remove("active");
      });

    document
      .getElementById("btn-confirm-cloud-save")
      ?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;

        btn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        btn.disabled = true;

        const h = parseInt(document.getElementById("track-h").value || 0, 10);
        const m = parseInt(document.getElementById("track-m").value || 0, 10);
        const s = parseInt(document.getElementById("track-s").value || 0, 10);

        this.secondsActive = h * 3600 + m * 60 + s;
        this.updateDisplay();
        this.triggerLocalAutoSave();

        const stoppedAtStr = this.formatTime(this.secondsActive).string;

        await saveWatchProgress({
          tmdbId: this.media.id,
          mediaType: this.media.type,
          seasonNumber: this.media.season,
          episodeNumber: this.media.episode,
          stoppedAt: stoppedAtStr,
        });

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo com sucesso!';

        setTimeout(() => {
          modal.classList.remove("active");
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 1500);
      });
  }
}
