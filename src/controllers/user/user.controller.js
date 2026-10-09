import UsersService from "../../services/user/user.service.js";

class UsersController {
  getUserId(req) {
    return req.user?.id;
  }

  // --- Listas Customizadas ---
  async getLists(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      const lists = await UsersService.getUserLists(userId);
      return res.json({ success: true, data: lists });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createList(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });
      if (!req.body.name)
        return res
          .status(400)
          .json({ success: false, error: "Nome obrigatório." });

      const newList = await UsersService.createList(userId, req.body.name);
      return res.json({ success: true, data: newList });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteList(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      await UsersService.deleteList(userId, req.params.listId);
      return res.json({ success: true, message: "Lista apagada." });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async toggleListItem(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      const { media_id, media_type } = req.body;
      if (!media_id || !media_type)
        return res
          .status(400)
          .json({ success: false, error: "Mídia incompleta." });

      const action = await UsersService.toggleListItem(
        userId,
        req.params.listId,
        media_id,
        media_type,
      );
      return res.json({ success: true, action });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateListVisibility(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      const { isPublic } = req.body;
      const { listId } = req.params;

      const updated = await UsersService.updateListVisibility(
        userId,
        listId,
        isPublic,
      );
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async getListDetails(req, res) {
    try {
      const listId = req.params.id;
      let token = null;

      // 1. Extração 100% segura do token
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      } else if (
        req.headers &&
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      // 2. Passa para o Service (O Service só vai verificar este token se a lista for privada)
      const listData = await UsersService.getListById(listId, token);

      return res.status(200).json({ success: true, data: listData });
    } catch (error) {
      const status = error.status || 500;
      const message = error.message || "Erro interno do servidor.";

      if (status === 500) {
        console.error("[DEV] Erro no ListController.getListDetails:", error);
      }

      return res.status(status).json({ success: false, error: message });
    }
  }

  // --- Progresso ---
  async getProgress(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      const progress = await UsersService.getWatchProgress(userId);
      return res.json({ success: true, data: progress });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async saveProgress(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      await UsersService.saveWatchProgress(userId, req.body);
      return res.json({ success: true });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async removeProgress(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      const { mediaType, tmdbId } = req.params;
      await UsersService.removeWatchProgress(userId, mediaType, tmdbId);
      return res.json({ success: true });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // --- Perfil ---
  async updateProfile(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      // O payload vem do body e pode conter um file enviado pelo multer (se houver upload de imagem pro Supabase Storage)
      const payload = { ...req.body };

      // Caso utilize upload de avatar, você manipularia o req.file aqui e faria o upload para gerar o avatar_url
      if (req.file) {
        // Ex: const avatarUrl = await uploadAvatarToStorage(req.file);
        // payload.avatar_url = avatarUrl;
      }

      const updatedUser = await UsersService.updateProfile(userId, payload);
      return res.json({ success: true, data: updatedUser });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async getReviews(req, res) {
    try {
      const { mediaType, tmdbId } = req.params;
      const reviews = await UsersService.getMediaReviews(mediaType, tmdbId);
      return res.json({ success: true, data: reviews });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async addInternalReview(req, res) {
    try {
      const userId = this.getUserId(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, error: "Não autenticado." });

      const payload = { ...req.body, user_id: userId };
      await UsersService.addInternalReview(payload);
      return res.json({
        success: true,
        message: "Avaliação salva com sucesso.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}

export default new UsersController();
