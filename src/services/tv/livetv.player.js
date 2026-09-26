const players = [
  {
    name: "Superflix",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcng9IjQwIiBmaWxsPSIjZmYwMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1NCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCxIZWx2ZXRpY2Esc2Fucy1zZXJpZiIgZm9udC1zaXplPSI2OCIgZm9udC13ZWlnaHQ9IjgwMCIgZmlsbD0iI2ZmZmZmZiI+U0E8L3RleHQ+PC9zdmc+",
    path: "https://superflixapi.pro/canal/",
    status: true,
  },
  {
    name: "embedTv",
    icon: "https://embedtv.lat/assets/logo.png",
    path: "https://ww4.embedtv.lat/",
    status: true,
  },
  {
    name: "Rei dos canais",
    icon: "https://embedtv.lat/assets/logo.png",
    path: "https://rdcanais.net/",
    status: true,
  },
];

export const GetAllPlayers = () =>
  players.filter((player) => player.status === true);

// Extract players method usado pelo livetv.service.js
export const extractLiveTvPlayers = (channel) => {
  const activePlayers = GetAllPlayers();
  return activePlayers.map((p) => ({
    title: p.name,
    url: `${p.path}${channel.id || channel.url_name || ""}`,
  }));
};

export const GetAllcategories = async () => {
  try {
    const url =
      "https://superflixapi.pro/lista?category=channel_categories&format=json";
    const response = await fetch(url);

    if (!response.ok) {
      // Fallback
      const fallbackResponse = await fetch(
        "https://api.reidoscanais.st/channels",
      );
      return await fallbackResponse.json();
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar categorias de canais:", error);
    return [];
  }
};
