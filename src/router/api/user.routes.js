import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { UserDataModule } from "../../modules/user/user_data.module.js";
import { requireAuth } from "../../middlewares/auth/auth.middleware.js"; // Ajuste o caminho se necessário
import { supabase } from "../../config/supabase.js";

export const userRoute = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB de segurança no Back-end também
});

userRoute.use(requireAuth);

// Obter Favoritos
userRoute.get("/watchlist", async (req, res) => {
  const userId = req.user.id;
  const data = await UserDataModule.getWatchlist(userId);

  if (data.success) {
    if (data.data) {
      const formattedData = data.data.map((item) => ({
        id: item.tmdb_id,
        type: item.media_type,
      }));
      return res.json(formattedData);
    }
    return res.json({
      success: true,
      data,
    });
  }
  return res.status(500).json({ success: false, error: data.error });
});

userRoute.post("/watchlist", async (req, res) => {
  const userId = req.user.id;
  const { tmdb_id, media_type } = req.body;

  const data = await UserDataModule.AddWatchlist({
    user_id: userId,
    tmdb_id,
    media_type,
  });

  if (data.success) {
    return res
      .status(201)
      .json({ success: true, action: "Criado com sucesso" });
  }
  return res.status(data.status).json({ success: false, error: data.error });
});

userRoute.delete("/watchlist", async (req, res) => {
  const userId = req.user.id;
  const { tmdb_id, media_type } = req.body;

  const data = await UserDataModule.RemoveWatchlist({
    user_id: userId,
    tmdb_id,
    media_type,
  });

  if (data.success) {
    return res.json({ success: true, action: data.action });
  }
  return res.status(data.status).json({ success: false, error: data.error });
});

// -------------------------------------------------------------
// 2. LISTAS CUSTOMIZADAS (Tabela: custom_lists)
// -------------------------------------------------------------

// Obter Listas Customizadas
userRoute.get("/custom-lists", async (req, res) => {
  const userId = req.user.id;

  const data = await UserDataModule.getCustomLists(userId);

  if (data.success) {
    return res.json(data);
  }
  return res.status(500).json({ success: false, error: data.error });
});

// Adicionar/Remover de uma Lista Customizada (Toggle)
userRoute.post("/custom-lists/toggle", async (req, res) => {
  const userId = req.user.id;
  const { tmdb_id, media_type, list_name } = req.body;

  const data = await UserDataModule.toggleCustomList({
    user_id: userId,
    tmdb_id,
    media_type,
    list_name,
  });

  if (data.success) {
    return res.json({ success: true, action: data.action });
  }
  return res.status(500).json({ success: false, error: data.error });
});

// ==========================================
// PROGRESSO (Continue Assistindo)
// ==========================================
userRoute.get("/progress", async (req, res) => {
  const result = await UserDataModule.getProgress(req.user.id);
  res.status(result.success ? 200 : 500).json(result);
});

userRoute.post("/progress/save", async (req, res) => {
  const { tmdb_id, media_type, season_number, episode_number, stopped_at } =
    req.body;

  if (!tmdb_id || !media_type) {
    return res.status(400).json({
      success: false,
      error: "Parâmetros 'tmdb_id' e 'media_type' são obrigatórios.",
    });
  }

  const result = await UserDataModule.upsertProgress({
    user_id: req.user.id,
    tmdb_id,
    media_type,
    season_number,
    episode_number,
    stopped_at,
  });
  res.status(result.success ? 200 : 500).json(result);
});

userRoute.delete("/progress/remove/:media_type/:tmdb_id", async (req, res) => {
  const { media_type, tmdb_id } = req.params;
  const result = await UserDataModule.removeProgress(
    req.user.id,
    tmdb_id,
    media_type,
  );
  res.status(result.success ? 200 : 500).json(result);
});

// ==========================================
// CONFIGURAÇÕES DO USUÁRIO
// ==========================================
userRoute.patch("/profile", upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body; // <--- Adicionamos o password aqui
    let finalAvatarUrl = null;

    // 1. Limpa o nome
    const cleanName = UserDataModule.sanitizeUsername(name);
    if (cleanName.length < 3) {
      return res.status(400).json({ success: false, error: "Nome inválido." });
    }

    // 2. SE O USUÁRIO MANDOU UMA FOTO NOVA, FAZ O UPLOAD PRO SUPABASE STORAGE
    if (req.file) {
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Erro ao enviar imagem: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      finalAvatarUrl = publicUrlData.publicUrl;
    }

    // 3. Monta os dados para salvar no banco 
    const updateData = {
      name: cleanName,
      email: email ? email.trim().toLowerCase() : req.user.email,
    };
    
    // Se o usuário digitou uma senha nova, anexa ela no objeto de update
    if (password) {
      updateData.password = password.trim();
    }
    
    if (finalAvatarUrl) {
      updateData.avatar_url = finalAvatarUrl;
    }

    // 4. Salva no banco de dados
    const result = await UserDataModule.updateProfile(userId, updateData);
    if (!result.success) {
      // Retorna o erro específico do banco (ex: "Password should be at least 6 characters")
      return res.status(400).json({ success: false, error: result.error });
    }

    const returnedAvatar =
      finalAvatarUrl || result.data?.avatar_url || req.user.avatar_url || "";

    // 5. ATUALIZA OS COOKIES DE SESSÃO COM O NOME NOVO, O ID E A FOTO
    const newPayload = {
      id: userId,
      name: cleanName,
      role: req.user.role,
      avatar_url: returnedAvatar,
    };

    const newAccessToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign(
      newPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const cookiePrefix = req.user.role === "admin" ? "admin" : "user";
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    };

    res.cookie(`${cookiePrefix}_access`, newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(`${cookiePrefix}_refresh`, newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      data: newPayload, 
    });
  } catch (error) {
    console.error("Erro na rota de atualizar perfil:", error);
    return res
      .status(500)
      .json({ success: false, error: "Erro interno do servidor." });
  }
});