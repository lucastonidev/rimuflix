import { STORAGE_KEYS } from "./storageKeys.js";

// Função melhorada que não confia apenas no localStorage
const checkAuthStatus = async () => {
  if (!localStorage.getItem(STORAGE_KEYS.USER_ID)) return false;

  try {
    const res = await fetch("/api/v1/auth/me");
    const json = await res.json();
    return json.success; // Se o servidor disse que o token é válido, retorna true
  } catch (e) {
    return false;
  }
};

export const getWatchProgressState = async () => {
  let cloudData = [];

  // 1. Verificamos a sessão de forma segura
  const isLoggedIn = await checkAuthStatus();

  if (isLoggedIn) {
    try {
      const response = await fetch("/api/v1/user/progress");
      const result = await response.json();

      if (result.success && result.data) {
        cloudData = result.data.map((item) => ({
          tmdbId: item.tmdb_id,
          mediaType: item.media_type,
          seasonNumber: item.season_number,
          episodeNumber: item.episode_number,
          timestamp: new Date(item.updated_at).getTime(),
          stoppedAt: item.stopped_at,
        }));
      }
    } catch (error) {
      console.warn(
        "Erro ao buscar progresso na nuvem. Recorrendo ao LocalStorage...",
        error,
      );
    }
  }

  // 2. Mescla com o local data independentemente de estar logado ou não
  const localData =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];
  const mergedData = [...localData];

  cloudData.forEach((cloudItem) => {
    const index = mergedData.findIndex(
      (localItem) => String(localItem.tmdbId) === String(cloudItem.tmdbId),
    );

    if (index !== -1) {
      if (!cloudItem.stoppedAt && mergedData[index].stoppedAt) {
        cloudItem.stoppedAt = mergedData[index].stoppedAt;
      }
      mergedData[index] = cloudItem;
    } else {
      mergedData.push(cloudItem);
    }
  });

  return mergedData;
};

export const saveWatchProgress = async (newItem) => {
  const isLoggedIn = await checkAuthStatus();

  if (isLoggedIn) {
    try {
      const payload = {
        tmdb_id: String(newItem.tmdbId),
        media_type: newItem.mediaType,
        season_number: newItem.seasonNumber || 1,
        episode_number: newItem.episodeNumber || 1,
      };

      if (newItem.stoppedAt) {
        payload.stopped_at = newItem.stoppedAt;
      }

      const response = await fetch("/api/v1/user/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.warn("Falha no servidor. Fallback ativado.", result.error);
      }
    } catch (error) {
      console.warn("Sem conexão. Fallback ativado.", error);
    }
  }

  autoSaveLocalProgress(newItem);
};

export const removeWatchProgress = async (tmdbId, mediaType = "tv") => {
  const isLoggedIn = await checkAuthStatus();

  if (isLoggedIn) {
    try {
      await fetch(`/api/v1/user/progress/remove/${mediaType}/${tmdbId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Erro ao remover progresso na nuvem", error);
    }
  }

  const currentProgress =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];
  const updatedProgress = currentProgress.filter(
    (item) => String(item.tmdbId) !== String(tmdbId),
  );
  localStorage.setItem(
    STORAGE_KEYS.WATCH_PROGRESS,
    JSON.stringify(updatedProgress),
  );
};

export const autoSaveLocalProgress = (newItem) => {
  const currentArray =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];
  const index = currentArray.findIndex(
    (item) => String(item.tmdbId) === String(newItem.tmdbId),
  );

  if (index === -1) {
    currentArray.push(newItem);
  } else {
    currentArray[index] = { ...currentArray[index], ...newItem };
  }

  localStorage.setItem(
    STORAGE_KEYS.WATCH_PROGRESS,
    JSON.stringify(currentArray),
  );
};
