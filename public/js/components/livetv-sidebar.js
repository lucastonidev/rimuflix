export function renderCategoryMenu(
  categories,
  headerContainer,
  listContainer,
  onCategoryClick,
) {
  headerContainer.innerHTML = `
    <div class="category-title" style="width:100%; text-align:center; font-size:1.1rem;">
      <i class="fa-solid fa-list"></i> Categorias
    </div>
  `;

  listContainer.innerHTML = "";

  // Garante que o menu expanda se estava encolhido
  const sidebar = listContainer.closest(".livetv-sidebar");
  if (sidebar) sidebar.classList.remove("collapsed");

  categories.forEach((cat) => {
    const catName = cat.name || cat.nome || cat.categoria || cat;
    const item = document.createElement("div");
    item.className = "channel-item";

    item.innerHTML = `
        <div class="channel-logo-box" style="background: var(--accent);">
            <i class="fa-solid fa-folder-open" style="color:white;"></i>
        </div>
        <div style="flex:1; min-width:0;">
            <div class="channel-name" style="font-size: 1rem;">${catName}</div>
        </div>
    `;

    item.addEventListener("click", () => onCategoryClick(catName));
    listContainer.appendChild(item);
  });
}

export function renderChannelList(
  channels,
  headerContainer,
  listContainer,
  callbacks,
) {
  headerContainer.innerHTML = `
    <button id="mini-btn-prev" class="cat-nav-btn" title="Voltar para Categorias">
      <i class="fa-solid fa-chevron-left"></i> Categorias
    </button>
    <button id="mini-btn-menu" class="cat-nav-btn" title="Ocultar/Mostrar Lista">
      <i class="fa-solid fa-bars"></i> Menu
    </button>
    <button id="mini-btn-next" class="cat-nav-btn" title="Selecionar Canal">
      Selecionar <i class="fa-solid fa-check"></i>
    </button>
  `;

  document
    .getElementById("mini-btn-prev")
    .addEventListener("click", callbacks.onMenuClick);

  // 👇 A MÁGICA AQUI: Oculta a Sidebar inteira
  document.getElementById("mini-btn-menu").addEventListener("click", () => {
    const sidebar = listContainer.closest(".livetv-sidebar");
    if (sidebar) sidebar.classList.toggle("collapsed");
  });

  document.getElementById("mini-btn-next").addEventListener("click", () => {
    const activeItem =
      listContainer.querySelector(".channel-item.active") ||
      listContainer.querySelector(".channel-item");
    if (activeItem) activeItem.click();
  });

  listContainer.innerHTML = "";

  // Garante que o menu expanda ao renderizar uma nova lista
  const sidebar = listContainer.closest(".livetv-sidebar");
  if (sidebar) sidebar.classList.remove("collapsed");

  if (channels.length === 0) {
    listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #9ca3af;">Nenhum canal encontrado nesta categoria.</div>`;
    return;
  }

  channels.forEach((ch, index) => {
    const name = ch.nome || ch.name || ch.titulo || "Canal";
    const logo = ch.logo_url || ch.img || ch.logo || ch.poster || "";
    const channelId = ch.id || name.replace(/\s+/g, "-");

    const item = document.createElement("div");
    item.className = `channel-item`;
    item.setAttribute("data-id", channelId);

    item.innerHTML = `
        <div class="channel-logo-box">
            ${logo ? `<img src="${logo}" loading="lazy">` : `<span style="font-size:10px; font-weight:bold;">${name.substring(0, 3).toUpperCase()}</span>`}
        </div>
        <div style="flex:1; min-width:0;">
            <div class="channel-name">${name}</div>
            <div class="channel-desc">Transmissão 24h</div>
        </div>
    `;

    item.addEventListener("click", () =>
      callbacks.onChannelSelect(ch, index, item),
    );
    listContainer.appendChild(item);
  });
}
