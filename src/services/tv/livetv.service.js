import NodeCache from "node-cache";

const channelsCache = new NodeCache({ stdTTL: 3600 }); // Cache de 1 hora

// Utilitário para limpar os nomes
const normalizeName = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// Utilitário para garantir que sempre recebemos uma array
const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    for (const key in data) {
      if (Array.isArray(data[key])) return data[key];
    }
    return Object.values(data).filter(
      (item) => item !== null && typeof item === "object",
    );
  }
  return [];
};

// ==========================================
// FUNÇÃO 1: SUPERFLIX
// ==========================================
const fetchSuperflix = async () => {
  try {
    const response = await fetch(
      "https://superflixapi.pro/lista?category=canais&format=json",
    );
    const data = await response.json();
    return extractArray(data);
  } catch (error) {
    console.error("Erro na API Superflix:", error.message);
    return [];
  }
};

// ==========================================
// FUNÇÃO 2: REI DOS EMBEDS
// ==========================================
const fetchReiDosEmbeds = async () => {
  try {
    const response = await fetch("https://reidosembeds.online/api/channels");
    const data = await response.json();
    return extractArray(data);
  } catch (error) {
    console.error("Erro na API Rei dos Embeds:", error.message);
    return [];
  }
};

// ==========================================
// FUNÇÃO 3: SEU PROVEDOR EXTRA ("MAIS 1")
// ==========================================
const fetchProvedorExtra = async () => {
  try {
    // 💡 COLOQUE A URL DA SUA NOVA API AQUI!
    const response = await fetch("https://api.reidoscanais.st/channels/");
    const data = await response.json();
    return extractArray(data);
    return []; // Retorna vazio enquanto você não coloca a URL
  } catch (error) {
    console.error("Erro na API Extra:", error.message);
    return [];
  }
};

// ==========================================
// MAESTRO: Junta tudo e formata
// ==========================================
export const getLiveTvChannelsService = async () => {
  if (channelsCache.has("tv_channels")) return channelsCache.get("tv_channels");

  // O Promise.all roda as 3 APIs ao mesmo tempo para ser muito mais rápido!
  const [superflixData, reiData, extraData] = await Promise.all([
    fetchSuperflix(),
    fetchReiDosEmbeds(),
    fetchProvedorExtra(),
  ]);

  const channelsMap = new Map();

  // 1. Mapeia Superflix
  superflixData.forEach((ch) => {
    if (!ch) return;
    const rawName = ch.nome || ch.name || ch.title || ch.canal;
    const normName = normalizeName(rawName);
    if (!normName) return;

    channelsMap.set(normName, {
      id: ch.id || normName,
      name: rawName,
      logo_url: ch.logo_url || ch.logo || ch.img || ch.imagem || "",
      categoria: ch.category || ch.categoria || "Outros",
      extractedPlayers: [],
      epg: [],
    });

    // 👇 CORREÇÃO: Agora buscamos por embed_url para o player da Superflix aparecer
    const playerUrl =
      ch.embed_url || ch.player || ch.url || ch.link || ch.embed;
    if (playerUrl) {
      channelsMap.get(normName).extractedPlayers.push({
        title: "Servidor 1 (Superflix)",
        url: playerUrl,
      });
    }
  });

  // 2. Mapeia Rei dos Embeds
  reiData.forEach((ch) => {
    if (!ch) return;
    const rawName = ch.name || ch.title || ch.nome;
    const normName = normalizeName(rawName);
    if (!normName) return;

    if (!channelsMap.has(normName)) {
      channelsMap.set(normName, {
        id: ch.id || normName,
        name: rawName,
        logo_url: ch.logo_url || ch.logo || ch.image || "",
        categoria: ch.category || ch.categoria || "Outros",
        extractedPlayers: [],
        epg: [],
      });
    }

    const channelObj = channelsMap.get(normName);

    const playerUrl = ch.embed_url || ch.embed || ch.url || ch.link;
    if (playerUrl) {
      channelObj.extractedPlayers.push({
        title: "Servidor 2 (Rei dos Embeds)",
        url: playerUrl,
      });
    }

    // Extrai o EPG do Rei dos Embeds
    if (ch.now_playing_has_guide && ch.now_playing_next_programmes) {
      const epgList = [];

      if (ch.now_playing_title) {
        const now = new Date();
        const currentHour =
          now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0");
        epgList.push({
          title: ch.now_playing_title,
          start: currentHour,
          stop: "...",
        });
      }

      ch.now_playing_next_programmes.forEach((prog) => {
        const startString = prog.start ? prog.start.substring(11, 16) : "";
        const stopString = prog.end ? prog.end.substring(11, 16) : "";

        epgList.push({
          title: prog.title,
          start: startString,
          stop: stopString,
        });
      });

      channelObj.epg = epgList;
    }
  });

  // 3. Mapeia o Provedor Extra
  extraData.forEach((ch) => {
    if (!ch) return;
    const rawName = ch.nome || ch.name || ch.title || ch.canal;
    const normName = normalizeName(rawName);
    if (!normName) return;

    if (!channelsMap.has(normName)) {
      channelsMap.set(normName, {
        id: ch.id || normName,
        name: rawName,
        logo_url: ch.logo_url || ch.logo || ch.img || ch.imagem || "",
        categoria: ch.category || ch.categoria || "Outros",
        extractedPlayers: [],
        epg: [],
      });
    }

    const channelObj = channelsMap.get(normName);
    
    const playerUrl = ch["embeds"][0]["embed_url"];

    if (playerUrl) {
      channelObj.extractedPlayers.push({
        title: "Servidor 3 (Extra)",
        url: playerUrl,
      });

      console.log(channelObj);
      
    }
  });

  const unifiedChannels = Array.from(channelsMap.values());

  if (unifiedChannels.length > 0) {
    channelsCache.set("tv_channels", unifiedChannels);
  }

  return unifiedChannels;
};
