import * as usersService from "../../services/admin/users.service.js";

const sanitizeUsername = (text) => {
  if (!text) return "";
  return text.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim();
};

export const getUsers = async (req, res) => {
  try {
    const data = await usersService.getAllUsers();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
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

export const createUser = async (req, res) => {
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

export const updateUser = async (req, res) => {
  const userId = req.params.id;
  
  const result = await usersService.updateUser(userId, req.body);

  if (!result.success) {
    return res.status(400).json(result); 
  }

  return res.json(result);
};