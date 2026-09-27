import * as usersService from "../../services/admin/users.service.js";

const sanitizeUsername = (text) => {
  if (!text) return "";
  return text.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim();
};

export const getUsersController = async (req, res) => {
  try {
    const data = await usersService.getAllUsers();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleUserStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStatus } = req.body;

    const updatedUser = await usersService.toggleUserStatus(id, currentStatus);

    return res.status(200).json({
      success: true,
      message: updatedUser.is_active
        ? "Usuário ativado!"
        : "Usuário bloqueado!",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createUserController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Nome, e-mail e senha são obrigatórios.",
      });
    }

    const cleanName = sanitizeUsername(name);

    if (cleanName.length < 3) {
      return res.status(400).json({
        success: false,
        error:
          "O nome de usuário deve ter pelo menos 3 letras/números válidos (emojis não contam).",
      });
    }

    const newUser = await usersService.createUser({
      name: cleanName,
      email: email.trim().toLowerCase(),
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso!",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "ID do usuário não fornecido." });
    }

    const cleanName = sanitizeUsername(name);
    if (cleanName && cleanName.length < 3) {
      return res.status(400).json({
        success: false,
        error:
          "O nome de usuário deve ter pelo menos 3 letras/números válidos.",
      });
    }

    // Passa os dados para o service tratar a atualização no banco (Supabase)
    const updatedUser = await usersService.updateUser(id, {
      name: cleanName,
      email: email ? email.trim().toLowerCase() : undefined,
      password: password || undefined, // Só envia a senha se o admin tiver digitado uma nova
      role: role || undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Usuário atualizado com sucesso!",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};