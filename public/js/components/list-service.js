import { STORAGE_KEYS } from "./storageKeys.js";

function loadFromLocalStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return defaultValue;
  }
}

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
  }
}

// --- Autenticação ---
export async function isUserLoggedIn() {
  const userId = localStorage.getItem("rimuflix:userId");
  if (!userId) return false;

  try {
    const DataFromUser = await fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((res) => {
        return res;
      });
    return DataFromUser.success;
  } catch (error) {
    console.error("Erro ao verificar status de login:", error);
    return false;
  }
}

// --- Operações de Favoritos ---
export async function getFavorites() {
  if (await isUserLoggedIn()) {
    try {
      const Favorites = await fetch("/api/v1/user/watchlist").then((res) =>
        res.json(),
      );

      if (Favorites.success) {
        // Correção: Extraímos o array contido em .data
        const dataArray = Favorites.data || [];
        saveToLocalStorage(STORAGE_KEYS.FAVORITES, dataArray);
        return dataArray;
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar favoritos na API. Usando fallback.", error);
    }
  }
  return loadFromLocalStorage(STORAGE_KEYS.FAVORITES);
}

export async function addFavorite(tmdbId, mediaType) {
  if (await isUserLoggedIn()) {
    try {
      const res = await fetch("/api/v1/user/watchlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType }),
      });
      if (!res.ok) throw new Error("Falha na API");
      return await res.json();
    } catch (error) {
      console.error("Erro ao alternar favorito na API:", error);
      throw new Error("Falha ao salvar nos favoritos. Tente novamente.");
    }
  } else {
    console.log("Salvando na local");
    const favorites = loadFromLocalStorage(STORAGE_KEYS.FAVORITES);
    const index = favorites.findIndex(
      (item) => item.id === tmdbId && item.type === mediaType,
    );

    let action;
    if (index > -1) {
      favorites.splice(index, 1);
      action = "removed";
    } else {
      favorites.push({ id: tmdbId, type: mediaType });
      action = "added";
    }

    saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites);
    return { success: true, action };
  }
}

export async function removeFavorite(tmdbId, mediaType) {
  if (await isUserLoggedIn()) {
    try {
      const res = await fetch("/api/v1/user/watchlist/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType }),
      });
      if (!res.ok) throw new Error("Falha na API");
      return await res.json();
    } catch (error) {
      console.error("Erro ao alternar favorito na API:", error);
      throw new Error("Falha ao salvar nos favoritos. Tente novamente.");
    }
  } else {
    console.log("Salvando na local");
    const favorites = loadFromLocalStorage(STORAGE_KEYS.FAVORITES);
    const index = favorites.findIndex(
      (item) => item.id === tmdbId && item.type === mediaType,
    );

    let action;
    if (index > -1) {
      favorites.splice(index, 1);
      action = "removed";
    } else {
      favorites.push({ id: tmdbId, type: mediaType });
      action = "added";
    }

    saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites);
    return { success: true, action };
  }
}

// --- Operações de Listas Personalizadas ---
export async function getCustomLists() {
  if (await isUserLoggedIn()) {
    try {
      const CustomLists = await fetch("/api/v1/user/custom-lists")
        .then((res) => res.json());

      if (CustomLists.success) {
        const dataArray = CustomLists.data || [];
        saveToLocalStorage(STORAGE_KEYS.CUSTOM_LISTS, dataArray);
        return dataArray;
      }
      return [];
    } catch (error) {
      console.error(
        "Erro ao buscar listas personalizadas na API. Usando fallback.",
        error,
      );
    }
  }
  return loadFromLocalStorage(STORAGE_KEYS.CUSTOM_LISTS);
}

export async function toggleCustomList(tmdbId, mediaType, listName) {
  if (await isUserLoggedIn()) {
    try {
      const res = await fetch("/api/v1/user/custom-lists/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: tmdbId,
          media_type: mediaType,
          list_name: listName,
        }),
      });
      if (!res.ok) throw new Error("Falha na API");
      return await res.json();
    } catch (error) {
      console.error("Erro ao alternar item na lista personalizada:", error);
      throw new Error(
        `Falha ao atualizar a lista "${listName}". Tente novamente.`,
      );
    }
  } else {
    const customLists = loadFromLocalStorage(STORAGE_KEYS.CUSTOM_LISTS);
    let list = customLists.find((l) => l.name === listName);

    if (!list) {
      // Cria a lista caso não exista no localStorage
      list = { id: crypto.randomUUID(), name: listName, items: [] };
      customLists.push(list);
    }

    const index = list.items.findIndex(
      (item) => item.id === tmdbId && item.type === mediaType,
    );
    let action;

    if (index > -1) {
      list.items.splice(index, 1);
      action = "removed";
    } else {
      list.items.push({ id: tmdbId, type: mediaType });
      action = "added";
    }

    saveToLocalStorage(STORAGE_KEYS.CUSTOM_LISTS, customLists);
    return { success: true, action };
  }
}
