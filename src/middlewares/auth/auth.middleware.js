import jwt from "jsonwebtoken";

export const requireAdmin = async (req, res, next) => {
  const accessToken = req.cookies?.admin_access;
  const refreshToken = req.cookies?.admin_refresh;

  // 1. Se não tiver NENHUM token, barra imediatamente e manda pro login
  if (!accessToken && !refreshToken) {
    return res.redirect("/login");
  }

  try {
    // 2. Tenta validar o Access Token (Curta duração)
    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

      // Verifica se a role do token é realmente admin
      if (decoded.role !== "admin") {
        return res
          .status(403)
          .send("Acesso Negado: Permissão de administrador necessária.");
      }

      req.user = decoded; // Disponibiliza os dados do usuário para as próximas rotas
      return next(); // Libera o acesso!
    }

    // Se o código chegou aqui, significa que o accessToken está ausente, forçamos o erro para ir pro catch
    throw new Error("Access token ausente");
  } catch (error) {
    // 3. O Access Token expirou ou falhou. Vamos tentar salvar usando o Refresh Token!
    if (!refreshToken) {
      return res.redirect("/login");
    }

    try {
      // Verifica se o Refresh Token é válido
      const refreshDecoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
      );

      // Gera um novo Access Token silenciosamente
      const novoPayload = { id: refreshDecoded.id, role: "admin" };
      const novoAccessToken = jwt.sign(novoPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      // Coloca o novo cookie no navegador do usuário
      res.cookie("admin_access", novoAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      req.user = novoPayload;
      return next(); // Libera o acesso!
    } catch (refreshError) {
      // 4. Se o Refresh Token também expirou ou foi fraudado, game over.
      res.clearCookie("admin_access");
      res.clearCookie("admin_refresh");
      return res.redirect("/login");
    }
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login?error=auth_required");
  }

  next();
};

export const checkUser = (req, res, next) => {
  const accessToken = req.cookies.admin_access || req.cookies.user_access;
  const refreshToken = req.cookies.admin_refresh || req.cookies.user_refresh;
  const isAdmin = !!req.cookies.admin_refresh;

  if (!accessToken && !refreshToken) {
    req.user = null;
    return next();
  }

  try {
    // 1. TENTA O TOKEN DE 15 MINUTOS PRIMEIRO
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // 2. SE CAIR AQUI, O DE 15 MIN EXPIROU. VAMOS TENTAR O REFRESH TOKEN!
    if (refreshToken) {
      try {
        const refreshDecoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET,
        );

        // Retira dados de tempo velhos para gerar um token novo
        const { iat, exp, ...userData } = refreshDecoded;

        // Gera novo Access Token de 15 minutos
        const newAccessToken = jwt.sign(userData, process.env.JWT_SECRET, {
          expiresIn: "15m",
        });

        // Salva o novo cookie com o nome CORRETO
        const cookieName = isAdmin ? "admin_access" : "user_access";
        res.cookie(cookieName, newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 15 * 60 * 1000, // 15 minutos
        });

        req.user = userData;
        return next();
      } catch (refreshErr) {
        // Refresh token também expirou ou é inválido. Deixa cair pro bloco final.
      }
    }

    // 3. FALHOU TUDO: Limpa os cookies usando os nomes exatos
    res.clearCookie("admin_access");
    res.clearCookie("admin_refresh");
    res.clearCookie("user_access");
    res.clearCookie("user_refresh");
    req.user = null;
    return next();
  }
};
