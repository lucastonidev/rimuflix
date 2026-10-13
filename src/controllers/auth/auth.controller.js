import AuthService from "../../services/auth/auth.service.js";

const authService = new AuthService();

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = email || username;

    if (!identifier || identifier.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "O e-mail ou nome de usuário é obrigatório.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "A senha é obrigatória.",
      });
    }

    // 1. AUTENTICAÇÃO NO BANCO COM SENHA
    const user = await authService.authenticateUser(identifier, password);

    if (!user.success) {
      return res.status(user.code).json({
        success: false,
        error: user.error || "Falha na autenticação.",
      });
    }

    const userData = user.data;

    // 3. CRIAÇÃO DOS COOKIES
    if (userData.user.role === "admin") {
      res.cookie("admin_access", userData.accessToken, userData.accessOptions);
      res.cookie("admin_refresh", userData.refreshToken, userData.refreshOptions);
    } else {
      res.cookie("user_access", userData.accessToken, userData.accessOptions);
      res.cookie("user_refresh", userData.refreshToken, userData.refreshOptions);
    }

    // 4. RETORNO DE SUCESSO
    return res.status(200).json({
      success: true,
      data: {
        id: userData.user.id,
        name: userData.user.name,
        role: userData.user.role,
        avatar_url: userData.user.avatar_url || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("admin_access");
    res.clearCookie("admin_refresh");
    res.clearCookie("user_access");
    res.clearCookie("user_refresh");

    return res
      .status(200)
      .json({ success: true, message: "Logout realizado com sucesso." });
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return res
      .status(500)
      .json({ success: false, error: "Erro interno ao sair." });
  }
};

export const me = async (req, res) => {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: {
          authenticated: false,
          role: "visitor",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
        avatar_url: req.user.avatar_url || "",
      },
    });
};
