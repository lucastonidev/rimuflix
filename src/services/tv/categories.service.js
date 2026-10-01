import NodeCache from "node-cache";

// Cache de 24 horas para não sobrecarregar as APIs externas
const categoryCache = new NodeCache({ stdTTL: 86400 });

// Função caçadora de Arrays
const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.canais)) return data.canais;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.categories)) return data.categories;
  if (typeof data === "object") return Object.values(data);
  return [];
};

export const GetCategoriesLiveTvService = async () => {
  if (categoryCache.has("tv_categories")) {
    return categoryCache.get("tv_categories");
  }

  try {
    const [superflixRes, reiRes] = await Promise.allSettled([
      fetch(
        "https://superflixapi.pro/lista?category=channel_categories&format=json",
      ).then((r) => r.json()),
      fetch("https://reidosembeds.online/api/channels/categories").then((r) =>
        r.json(),
      ),
    ]);

    const categoriesSet = new Set();

    // 👇 Função auxiliar para processar e filtrar o nome da categoria
    const processCategory = (c) => {
      if (!c) return;
      const name = c.name || c.categoria || c.title || c;

      if (typeof name === "string") {
        const cleanName = name.trim();
        if (
          cleanName.length > 0 &&
          cleanName.length < 25 &&
          !cleanName.toLowerCase().includes("requisições") &&
          !cleanName.toLowerCase().includes("erro")
        ) {
          categoriesSet.add(cleanName);
        }
      }
    };

    if (superflixRes.status === "fulfilled") {
      extractArray(superflixRes.value).forEach(processCategory);
    }

    if (reiRes.status === "fulfilled") {
      extractArray(reiRes.value).forEach(processCategory);
    }

    const formattedCategories = Array.from(categoriesSet).map((name) => ({
      name,
    }));

    // Só salva no cache se tiver categorias válidas (evita salvar a tela em branco se tomar block)
    if (formattedCategories.length > 0) {
      categoryCache.set("tv_categories", formattedCategories);
    }

    return formattedCategories;
  } catch (error) {
    console.error("Erro ao agregar categorias de TV:", error);
    return [];
  }
};
