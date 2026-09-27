import { UserDataModule } from "../../modules/user/user_data.module.js"; // Ajuste o caminho conforme seu projeto

export const saveWatchProgress = async (req, res) => {
  try {
    // Validação 401: Não Autorizado
    const userId = req.user?.id || req.cookies?.["rimuflix:userId"];
    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          error: "Usuário não autenticado. Faça login.",
        });
    }

    const { tmdb_id, media_type, season_number, episode_number, stopped_at } =
      req.body;

    // Validação 400: Bad Request (Faltam dados)
    if (!tmdb_id || !media_type) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros 'tmdb_id' e 'media_type' são obrigatórios.",
      });
    }

    // Monta o objeto dinamicamente
    const progressData = {
      user_id: userId,
      tmdb_id: String(tmdb_id),
      media_type,
      season_number: season_number || 1,
      episode_number: episode_number || 1,
    };

    // Anexa o tempo apenas se o usuário tiver passado um valor válido
    if (stopped_at !== undefined && stopped_at !== null) {
      progressData.stopped_at = stopped_at;
    }

    // Chama o seu módulo de banco de dados
    const result = await UserDataModule.upsertProgress(progressData);

    // Validação 422: Erro semântico/Entidade não processável (Falha no banco)
    if (!result.success) {
      return res
        .status(422)
        .json({
          success: false,
          error: result.error || "Não foi possível registrar o progresso.",
        });
    }

    // 200: OK
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Progress Controller Error]:", error);
    // Validação 500: Erro Crítico no Servidor
    return res
      .status(500)
      .json({
        success: false,
        error: "Erro interno no servidor ao processar o salvamento.",
      });
  }
};
