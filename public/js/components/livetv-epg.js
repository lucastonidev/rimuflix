export async function updateEPG(channel, nameContainer, listContainer) {
  const name = channel.nome || channel.name || channel.titulo || "Canal";
  const logo =
    channel.logo_url || channel.img || channel.logo || channel.poster || "";

  nameContainer.innerHTML = `
      <div class="epg-logo-small">
          ${logo ? `<img src="${logo}">` : `<span style="font-size:10px;">${name.substring(0, 3)}</span>`}
      </div>
      ${name}
  `;
console.log(channel);

  listContainer.innerHTML = `
    <div style="text-align: center; color: var(--text-secondary); margin-top: 20px;">
      <i class="fa-solid fa-spinner fa-spin"></i> Carregando programação...
    </div>
  `;

  try {
    // 👇 Consulta nosso novo serviço backend
    const response = await fetch(
      `/api/v1/livetv/epg?channel=${encodeURIComponent(name)}`,
    );
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      let html = `<h3 style="margin-bottom: 15px; font-size: 1rem;"><i class="fa-solid fa-calendar-days"></i> Programação</h3>
                  <div class="epg-timeline-line" style="top: 40px;"></div>`;

      // Desenha até 5 próximos programas da grade do canal
      result.data.slice(0, 5).forEach((prog, index) => {
        const isCurrent = index === 0 ? "current" : "";
        const nowTag =
          index === 0
            ? `<div class="epg-now-tag">Transmitindo Agora</div>`
            : "";

        // Pega a hora formatada (ex: 21:10) e o nome do programa
        const startTime = prog.start || "--:--";
        const progTitle = prog.title || "Programação indisponível";

        html += `
          <div class="epg-item ${isCurrent}">
              <div class="epg-time">${startTime}</div>
              <div class="epg-details">
                  <div class="epg-title">${progTitle}</div>
                  ${nowTag}
              </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
      return;
    }
  } catch (error) {
    console.error("Falha ao buscar EPG real, usando fallback", error);
  }

  // FALLBACK: Se o canal não tiver programação disponível
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0") + ":00";
  const nextHour = (now.getHours() + 1).toString().padStart(2, "0") + ":00";

  listContainer.innerHTML = `
      <h3 style="margin-bottom: 15px; font-size: 1rem;"><i class="fa-solid fa-calendar-days"></i> Programação</h3>
      <div class="epg-timeline-line" style="top: 40px;"></div>
      <div class="epg-item current">
          <div class="epg-time">${currentHour}</div>
          <div class="epg-details">
              <div class="epg-title">Transmissão Ao Vivo</div>
              <div class="epg-now-tag">Transmitindo Agora</div>
          </div>
      </div>
      <div class="epg-item">
          <div class="epg-time">${nextHour}</div>
          <div class="epg-details">
              <div class="epg-title">Programação Contínua</div>
          </div>
      </div>
  `;
}
