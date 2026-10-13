import { STORAGE_KEYS } from "./storageKeys.js";

// Função melhorada que não confia apenas no localStorage
const checkAuthStatus = async () => {
  try {
    const res = await fetch("/api/v1/auth/me", {
      credentials: "same-origin",
    });
    const json = await res.json();
    return json.success && json.data.authenticated === true;
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
      const response = await fetch("/api/v1/user/progress", {
        credentials: "same-origin",
      });
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
      (localItem) =>
        String(localItem.tmdbId) === String(cloudItem.tmdbId) &&
        localItem.mediaType === cloudItem.mediaType,
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
  autoSaveLocalProgress(newItem);
  const isLoggedIn = await checkAuthStatus();

  if (isLoggedIn) {
    try {
      const payload = {
        tmdb_id: String(newItem.tmdbId),
        media_type: newItem.mediaType,
        season_number: newItem.seasonNumber || 1,
        episode_number: newItem.episodeNumber || 1,
      };

      if (newItem.stoppedAt !== undefined) {
        payload.stopped_at = newItem.stoppedAt;
      }

      const response = await fetch("/api/v1/user/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Falha ao salvar progresso no banco.", {
          status: response.status,
          error: result.error,
        });
      }
    } catch (error) {
      console.warn("Sem conexão. Fallback ativado.", error);
    }
  }

};

export const removeWatchProgress = async (tmdbId, mediaType = "tv") => {
  const isLoggedIn = await checkAuthStatus();

  if (isLoggedIn) {
    try {
      await fetch(`/api/v1/user/progress/remove/${mediaType}/${tmdbId}`, {
        method: "DELETE",
        credentials: "same-origin",
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
    (item) =>
      String(item.tmdbId) === String(newItem.tmdbId) &&
      item.mediaType === newItem.mediaType,
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
