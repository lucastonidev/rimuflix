import * as AuthService from "../../services/auth/auth.service.js";
import jwt from "jsonwebtoken";

// Constantes de tempo para garantir que JWT e Cookies tenham exatamente a mesma validade
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const COOKIE_ACCESS_AGE = 15 * 60 * 1000; // 15 minutos em ms
const COOKIE_REFRESH_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

// Função utilitária para manter os cookies seguros e com a mesma configuração (DRY)
const getCookieOptions = (maxAge) => ({
  httpOnly: true, // Protege contra roubo via XSS (document.cookie)
  secure: process.env.NODE_ENV === "production", // Requer HTTPS em produção
  sameSite: "Strict", // Protege contra falsificação de requisição entre sites (CSRF)
  path: "/",
  maxAge: maxAge,
});

export const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
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
    const user = await AuthService.authenticateUser(identifier, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado.",
      });
    }

    // 2. GERAÇÃO DOS TOKENS JWT
    // Guardamos também a foto (avatar_url) para o Front-end usar nas configurações
    const jwtPayload = {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url || "",
    };

    const accessToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || "sua_chave_secreta_aqui",
      { expiresIn: ACCESS_EXPIRES_IN },
    );

    // O Refresh Token também carrega os dados básicos para não precisarmos bater no banco na hora de renovar
    const refreshToken = jwt.sign(
      jwtPayload,
      process.env.JWT_REFRESH_SECRET || "sua_chave_refresh_aqui",
      { expiresIn: REFRESH_EXPIRES_IN },
    );

    // 3. CRIAÇÃO DOS COOKIES
    if (user.role === "admin") {
      res.cookie(
        "admin_access",
        accessToken,
        getCookieOptions(COOKIE_ACCESS_AGE),
      );
      res.cookie(
        "admin_refresh",
        refreshToken,
        getCookieOptions(COOKIE_REFRESH_AGE),
      );
    } else {
      res.cookie(
        "user_access",
        accessToken,
        getCookieOptions(COOKIE_ACCESS_AGE),
      );
      res.cookie(
        "user_refresh",
        refreshToken,
        getCookieOptions(COOKIE_REFRESH_AGE),
      );
    }

    // 4. RETORNO DE SUCESSO
    return res.status(200).json({
      success: true,
      data: jwtPayload,
    });
  } catch (error) {
    console.error("Erro no controlador de login:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor.",
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

export const me = (req, res) => {
  try {
    const accessToken = req.cookies.admin_access || req.cookies.user_access;
    const refreshToken = req.cookies.admin_refresh || req.cookies.user_refresh;
    const isAdmin = !!req.cookies.admin_refresh;

    if (!accessToken && !refreshToken) {
      return res
        .status(401)
        .json({ success: false, error: "Sessão não encontrada." });
    }

    try {
      // 1. TENTA VALIDAR O TOKEN DE 15 MINUTOS PRIMEIRO
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET || "sua_chave_secreta_aqui",
      );
      return res.status(200).json({ success: true, data: decoded });
    } catch (accessError) {
      // 2. SE O DE 15 MINUTOS MORREU, TENTA USAR O DE 7 DIAS (ROLLING SESSION)
      if (refreshToken) {
        try {
          const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || "sua_chave_refresh_aqui",
          );

          // Remove campos de tempo velhos para gerar um novo token limpo
          const { iat, exp, ...userData } = decodedRefresh;

          // Gera um NOVO Access Token de 15 minutos
          const newAccessToken = jwt.sign(
            userData,
            process.env.JWT_SECRET || "sua_chave_secreta_aqui",
            { expiresIn: ACCESS_EXPIRES_IN },
          );

          // Atualiza o cookie no navegador do usuário silenciosamente
          if (isAdmin) {
            res.cookie(
              "admin_access",
              newAccessToken,
              getCookieOptions(COOKIE_ACCESS_AGE),
            );
          } else {
            res.cookie(
              "user_access",
              newAccessToken,
              getCookieOptions(COOKIE_ACCESS_AGE),
            );
          }

          return res.status(200).json({ success: true, data: userData });
        } catch (refreshError) {
          // Se o de 7 dias também morreu (ou foi adulterado), aí sim deslogamos
          throw new Error("Refresh token inválido");
        }
      } else {
        throw new Error("Access token expirado e Refresh token ausente");
      }
    }
  } catch (error) {
    console.error("Sessão expirada. Limpando cookies.");
    res.clearCookie("admin_access");
    res.clearCookie("admin_refresh");
    res.clearCookie("user_access");
    res.clearCookie("user_refresh");

    return res.status(401).json({
      success: false,
      error: "Sessão expirada ou inválida.",
    });
  }
};
