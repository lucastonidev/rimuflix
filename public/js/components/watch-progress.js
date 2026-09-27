import { STORAGE_KEYS } from "./storageKeys.js";

// Função auxiliar para saber se está logado
const isUserLoggedIn = () => {
  return !!localStorage.getItem("rimuflix:userId");
};

export const getWatchProgressState = async () => {
  let cloudData = [];

  // 1. Tenta buscar da Nuvem se estiver logado
  if (isUserLoggedIn()) {
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

  // 2. Busca os dados do LocalStorage (Sempre)
  const localData =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];

  // 3. Mescla os dados de forma inteligente
  const mergedData = [...localData];

  cloudData.forEach((cloudItem) => {
    const index = mergedData.findIndex(
      (localItem) => String(localItem.tmdbId) === String(cloudItem.tmdbId),
    );

    if (index !== -1) {
      // Se a nuvem retornou null ou vazio para o tempo, resgatamos o tempo do LocalStorage!
      if (!cloudItem.stoppedAt && mergedData[index].stoppedAt) {
        cloudItem.stoppedAt = mergedData[index].stoppedAt;
      }

      // Atualiza o item local com os dados finais validados
      mergedData[index] = cloudItem;
    } else {
      // Se só existir na Nuvem, adiciona à lista final
      mergedData.push(cloudItem);
    }
  });

  return mergedData;
};

export const saveWatchProgress = async (newItem) => {
  let savedToCloud = false;

  if (isUserLoggedIn()) {
    try {
      // Constrói o payload básico com os dados obrigatórios
      const payload = {
        tmdb_id: String(newItem.tmdbId),
        media_type: newItem.mediaType,
        season_number: newItem.seasonNumber || 1,
        episode_number: newItem.episodeNumber || 1,
      };

      // Só anexa o tempo se ele foi gerado pelo cronômetro
      if (newItem.stoppedAt) {
        payload.stopped_at = newItem.stoppedAt;
      }

      const response = await fetch("/api/v1/user/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        savedToCloud = true;
      } else {
        console.warn("Falha no servidor. Fallback ativado.", result.error);
      }
    } catch (error) {
      console.warn("Sem conexão. Fallback ativado.", error);
    }
  }

  // Fallback: Sincroniza localmente sempre
  autoSaveLocalProgress(newItem);
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

export const autoSaveLocalProgress = (newItem) => {
  const currentArray =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS)) || [];
  const index = currentArray.findIndex(
    (item) => String(item.tmdbId) === String(newItem.tmdbId),
  );

  if (index === -1) {
    currentArray.push(newItem);
  } else {
    // 👇 A MÁGICA ACONTECE AQUI: Mescla o dado antigo com o novo, preservando o stoppedAt
    currentArray[index] = { ...currentArray[index], ...newItem };
  }

  localStorage.setItem(
    STORAGE_KEYS.WATCH_PROGRESS,
    JSON.stringify(currentArray),
  );
};