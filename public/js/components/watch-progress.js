import { STORAGE_KEYS } from "./storageKeys.js";

// Função auxiliar para saber se está logado
const isUserLoggedIn = () => {
  return !!localStorage.getItem("rimuflix:userId");
};

export const getWatchProgressState = async () => {
  if (isUserLoggedIn()) {
    try {
      const response = await fetch("/api/v1/user/progress");
      const result = await response.json();
      if (result.success && result.data) {
        // Padroniza as chaves do banco para o formato que seu frontend já usa
        return result.data.map((item) => ({
          tmdbId: item.tmdb_id,
          mediaType: item.media_type,
          seasonNumber: item.season_number,
          episodeNumber: item.episode_number,
          timestamp: new Date(item.updated_at).getTime(),
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar progresso na nuvem", error);
    }
  }

  // Fallback para visitante
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];
};

export const saveWatchProgress = async (newItem) => {
  if (isUserLoggedIn()) {
    try {
      await fetch("/api/v1/user/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: String(newItem.tmdbId),
          media_type: newItem.mediaType,
          season_number: newItem.seasonNumber || 1,
          episode_number: newItem.episodeNumber || 1,
          stopped_at: newItem.stoppedAt || null,
        }),
      });
    } catch (error) {
      console.error("Erro ao salvar progresso na nuvem", error);
    }
  } else {
    // Fallback para visitante
    const currentArray =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];
    const index = currentArray.findIndex(
      (item) => String(item.tmdbId) === String(newItem.tmdbId),
    );

    if (index === -1) {
      currentArray.push(newItem);
    } else {
      currentArray[index] = newItem;
    }
    localStorage.setItem(
      STORAGE_KEYS.WATCH_PROGRESS,
      JSON.stringify(currentArray),
    );
  }
};

export const removeWatchProgress = async (tmdbId, mediaType = "tv") => {
  if (isUserLoggedIn()) {
    try {
      // Manda os dados na URL, em vez de usar body!
      await fetch(`/api/v1/user/progress/remove/${mediaType}/${tmdbId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Erro ao remover progresso na nuvem", error);
    }
  }

  // Fallback visitante
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
