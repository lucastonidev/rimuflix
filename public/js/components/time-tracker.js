import { saveWatchProgress } from "./watch-progress.js";

export class TimeTracker {
  constructor(mediaData) {
    this.media = mediaData;
    this.secondsActive = 0;
    this.interval = null;

    this.init();
  }

  init() {
    this.injectWidget();
    this.injectModal();
    this.startTimer();
    this.setupListeners();
    this.setupDragAndDrop();
  }

  startTimer() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.secondsActive++;
      this.updateWidgetDisplay();
    }, 1000);
  }

  pauseTimer() {
    clearInterval(this.interval);
    this.interval = null;
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

  updateWidgetDisplay() {
    const display = document.getElementById("tracker-time-display");
    if (display) {
      display.textContent = this.formatTime(this.secondsActive).string;
    }
  }

  injectWidget() {
    const widgetHtml = `
      <div id="time-tracker-widget" class="time-tracker-widget">
        <div id="tracker-drag-handle" class="tracker-drag-handle" title="Arraste para mover">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
        
        <div id="tracker-content" class="tracker-content">
          <div class="tracker-info">
            <i class="fa-solid fa-stopwatch"></i>
            <span id="tracker-time-display">00:00:00</span>
          </div>
          <button id="btn-open-tracker-modal" class="btn-tracker" title="Salvar onde parei">
            <i class="fa-solid fa-flag-checkered"></i> Salvar
          </button>
        </div>

        <button id="btn-toggle-tracker" class="btn-tracker-toggle" title="Minimizar">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", widgetHtml);
  }

  injectModal() {
    const modalHtml = `
      <div id="time-tracker-modal" class="tracker-modal-overlay">
        <div class="tracker-modal-box">
          <div class="tracker-modal-header">
            <h3 class="tracker-modal-title"><i class="fa-solid fa-clock"></i> Onde você parou?</h3>
            <button id="close-tracker-modal" class="tracker-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="tracker-modal-body" style="text-align: left;">
            <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem; line-height: 1.5;">
              Calculamos o tempo que você ficou com esta página aberta. Confirme ou ajuste manualmente o momento exato em que parou de assistir.
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
            <button id="btn-save-tracked-time" class="tracker-btn-submit">
              Salvar Tempo
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

    const widget = document.getElementById("time-tracker-widget");
    const toggleBtn = document.getElementById("btn-toggle-tracker");
    const modal = document.getElementById("time-tracker-modal");

    // Lógica de Minimizar/Expandir
    toggleBtn.addEventListener("click", () => {
      widget.classList.toggle("minimized");
      toggleBtn.title = widget.classList.contains("minimized")
        ? "Expandir"
        : "Minimizar";
    });

    document
      .getElementById("btn-open-tracker-modal")
      .addEventListener("click", () => {
        const time = this.formatTime(this.secondsActive);
        document.getElementById("track-h").value = time.h;
        document.getElementById("track-m").value = time.m;
        document.getElementById("track-s").value = time.s;
        modal.classList.add("active");
      });

    document
      .getElementById("close-tracker-modal")
      .addEventListener("click", () => {
        modal.classList.remove("active");
      });

    document
      .getElementById("btn-save-tracked-time")
      .addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        btn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

        const h = document.getElementById("track-h").value.padStart(2, "0");
        const m = document.getElementById("track-m").value.padStart(2, "0");
        const s = document.getElementById("track-s").value.padStart(2, "0");
        const stoppedAtStr = `${h}:${m}:${s}`;

        await saveWatchProgress({
          tmdbId: this.media.id,
          mediaType: this.media.type,
          seasonNumber: this.media.season,
          episodeNumber: this.media.episode,
          stoppedAt: stoppedAtStr,
        });

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
        setTimeout(() => {
          modal.classList.remove("active");
          btn.innerHTML = "Salvar Tempo";
        }, 1000);
      });
  }

  setupDragAndDrop() {
    const widget = document.getElementById("time-tracker-widget");
    const handle = document.getElementById("tracker-drag-handle");

    let isDragging = false;
    let offsetX, offsetY;

    const startDrag = (e) => {
      isDragging = true;
      const clientX = e.type.includes("mouse")
        ? e.clientX
        : e.touches[0].clientX;
      const clientY = e.type.includes("mouse")
        ? e.clientY
        : e.touches[0].clientY;

      const rect = widget.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

      // Remove a transição enquanto arrasta para ficar instantâneo
      widget.style.transition = "none";
    };

    const doDrag = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const clientX = e.type.includes("mouse")
        ? e.clientX
        : e.touches[0].clientX;
      const clientY = e.type.includes("mouse")
        ? e.clientY
        : e.touches[0].clientY;

      let newX = clientX - offsetX;
      let newY = clientY - offsetY;

      // Impede que o widget suma para fora da tela enquanto arrasta
      const rect = widget.getBoundingClientRect();
      newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));

      // Limpa as âncoras para usar posicionamento absoluto
      widget.style.bottom = "auto";
      widget.style.right = "auto";
      widget.style.left = `${newX}px`;
      widget.style.top = `${newY}px`;
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;

      // Devolve as animações suaves
      widget.style.transition = "all 0.3s ease";

      // ==========================================
      // LÓGICA DO EFEITO ÍMÃ (SNAP TO EDGE)
      // ==========================================
      const rect = widget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const widgetCenter = rect.left + rect.width / 2;

      // Se soltou na metade esquerda da tela, cola na esquerda
      if (widgetCenter < screenWidth / 2) {
        widget.style.left = "20px";
        widget.style.right = "auto";
      }
      // Se soltou na metade direita da tela, cola na direita
      else {
        widget.style.left = "auto";
        widget.style.right = "20px";
      }

      // Garante que não fique colado demais no topo ou no rodapé
      if (rect.top < 20) widget.style.top = "20px";
      if (rect.bottom > window.innerHeight - 20) {
        widget.style.top = `${window.innerHeight - rect.height - 20}px`;
      }
    };

    // Eventos Mouse (Desktop)
    handle.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", endDrag);

    // Eventos Touch (Mobile)
    handle.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("touchmove", doDrag, { passive: false });
    document.addEventListener("touchend", endDrag);
  }
}
