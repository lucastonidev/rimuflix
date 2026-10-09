// public/js/admin/dashboard.js
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);

class AdminDashboard {
  constructor() {
    this.elements = {
      statMedia: document.getElementById("stat-media"),
      statUsers: document.getElementById("stat-users"),
      statLists: document.getElementById("stat-lists"),
      statReviews: document.getElementById("stat-reviews"),
      timeline: document.getElementById("recent-media-timeline"),
    };

    this.init();
  }

  async init() {
    try {
      const response = await fetch("/api/v1/admin/dashboard");
      const result = await response.json();

      if (result.success) {
        this.updateStats(result.data.stats);
        this.updateTimeline(result.data.recentMedia);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      this.elements.timeline.innerHTML =
        '<p style="color: #ef4444;">Erro ao carregar dados.</p>';
    }
  }

  updateStats(stats) {
    this.elements.statMedia.textContent = stats.media;
    this.elements.statUsers.textContent = stats.users;
    this.elements.statLists.textContent = stats.lists;
    this.elements.statReviews.textContent = stats.reviews;
  }

  updateTimeline(recentMedia) {
    if (!recentMedia || recentMedia.length === 0) {
      this.elements.timeline.innerHTML =
        '<p style="color: var(--text-secondary); font-size: 0.85rem;">Nenhuma mídia adicionada ainda.</p>';
      return;
    }

    let html = "";

    recentMedia.forEach((media) => {
      // Formata a data (Ex: 02/08/2026 às 15:30)
      const date = new Date(media.created_at);
      const formattedDate =
        date.toLocaleDateString("pt-BR") +
        " às " +
        date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

      const icon = media.media_type === "movie" ? "fa-film" : "fa-tv";
      const colorClass = media.media_type === "movie" ? "red" : "blue";

      html += `
        <div class="timeline-item">
          <div class="timeline-icon ${colorClass}"><i class="fa-solid ${icon}"></i></div>
          <div class="timeline-content">
            <h4>${escapeHtml(media.title)}</h4>
            <div class="timeline-time">
              <i class="fa-regular fa-clock"></i> ${formattedDate}
            </div>
          </div>
        </div>
      `;
    });

    this.elements.timeline.innerHTML = html;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AdminDashboard();
});
