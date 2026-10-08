import { STORAGE_KEYS } from "./storageKeys.js";

// Função utilitária para manter fallback local para visitantes
function loadLocalLists() {
  try {
    const data = localStorage.getItem("rimuflix:playlists");
    // Se não existir, cria a lista Favoritos por padrão localmente
    return data
      ? JSON.parse(data)
      : [{ id: "default", name: "Favoritos", is_public: false, items: [] }];
  } catch (e) {
    return [{ id: "default", name: "Favoritos", is_public: false, items: [] }];
  }
}

function saveLocalLists(data) {
  localStorage.setItem("rimuflix:playlists", JSON.stringify(data));
}

export async function isUserLoggedIn() {
  const userId = localStorage.getItem("rimuflix:userId");
  if (!userId) return false;
  try {
    const res = await fetch("/api/v1/auth/me").then((r) => r.json());
    return res.success;
  } catch (error) {
    return false;
  }
}

// 1. Busca todas as listas (A API agora deve retornar [{ id, name, is_public, items: [{media_id, media_type}] }])
export async function getUserLists() {
  if (await isUserLoggedIn()) {
    try {
      const res = await fetch("/api/v1/user/lists").then((r) => r.json());
      if (res.success) {
        saveLocalLists(res.data); // Sincroniza localmente
        return res.data || [];
      }
    } catch (error) {
      console.error("Erro ao buscar listas na API:", error);
    }
  }
  return loadLocalLists();
}

// 2. Cria uma nova lista
export async function createList(name) {
  if (await isUserLoggedIn()) {
    const res = await fetch("/api/v1/user/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => r.json());
    if (!res.success) throw new Error(res.error);
    return res;
  } else {
    const lists = loadLocalLists();

    // 👇 Correção: Precisamos guardar a lista numa variável para poder retornar o ID dela!
    const newList = {
      id: crypto.randomUUID(),
      name,
      is_public: false,
      items: [],
    };

    lists.push(newList);
    saveLocalLists(lists);

    // 👇 Retornamos o data para que o PlaylistModal consiga achar o ID
    return { success: true, data: newList };
  }
}

// 3. Deleta uma lista (Não permite deletar a Favoritos)
export async function deleteList(listId) {
  if (await isUserLoggedIn()) {
    const res = await fetch(`/api/v1/user/lists/${listId}`, {
      method: "DELETE",
    }).then((r) => r.json());
    if (!res.success) throw new Error(res.error);
    return res;
  } else {
    let lists = loadLocalLists();
    lists = lists.filter((l) => l.id !== listId);
    saveLocalLists(lists);
    return { success: true };
  }
}

// 4. Adiciona ou Remove um item da lista
export async function toggleListItem(listId, mediaId, mediaType) {
  if (await isUserLoggedIn()) {
    const res = await fetch(`/api/v1/user/lists/${listId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_id: String(mediaId),
        media_type: mediaType,
      }),
    }).then((r) => r.json());
    if (!res.success) throw new Error("Falha na API");
    return res;
  } else {
    const lists = loadLocalLists();
    const list = lists.find((l) => l.id === listId);
    if (!list) throw new Error("Lista não encontrada");

    const index = list.items.findIndex(
      (i) =>
        String(i.media_id) === String(mediaId) && i.media_type === mediaType,
    );

    let action;
    if (index > -1) {
      list.items.splice(index, 1);
      action = "removed";
    } else {
      list.items.push({ media_id: String(mediaId), media_type: mediaType });
      action = "added";
    }

    saveLocalLists(lists);
    return { success: true, action };
  }
}

export async function updateListVisibility(listId, isPublic) {
  if (await isUserLoggedIn()) {
    const res = await fetch(`/api/v1/user/lists/${listId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    }).then((r) => r.json());

    if (!res.success) throw new Error(res.error);
    return res;
  } else {
    // Modo Visitante (Local)
    const lists = loadLocalLists();
    const list = lists.find((l) => l.id === listId);
    if (list) {
      list.is_public = isPublic;
      saveLocalLists(lists);
    }
    return { success: true };
  }
}