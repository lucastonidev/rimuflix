export function renderSidebarInfo(data, type) {
  const baseInfo = `
    <div class="info-item">
      <span class="info-label">Título original:</span>
      <span class="info-value">${data.original_title ?? data.original_name ?? "Não informado"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Popularidade:</span>
      <span class="info-value">${data.popularity ?? "Não informado"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Votos:</span>
      <span class="info-value">${data.vote_count ?? 0}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Idioma original:</span>
      <span class="info-value">${data.original_language ?? "Não informado"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Gêneros:</span>
      <span class="info-value">${data.genres?.map((g) => g.name).join(", ") ?? "Não informado"}</span>
    </div>
  `;

  if (type === "tv") {
    return (
      baseInfo +
      `
      <div class="info-item">
        <span class="info-label">Temporadas:</span>
        <span class="info-value">${data.number_of_seasons ?? "Não informado"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Episódios:</span>
        <span class="info-value">${data.number_of_episodes ?? "Não informado"}</span>
      </div>
    `
    );
  }

  return baseInfo;
}
