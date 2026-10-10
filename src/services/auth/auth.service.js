import { supabase, supabaseAdmin } from "../../config/supabase.js";
import jwt from "jsonwebtoken";

export async function authenticateUser(identifier, password) {
  if (!password) throw new Error("A senha é obrigatória.");

  const isEmail = identifier.includes("@");
  let loginEmail = identifier.toLowerCase().trim();
  if (!isEmail) {
    const { data: userRecord, error: dbError } = await supabaseAdmin
      .from("users")
      .select("email, is_active")
      .ilike("name", identifier.trim())
      .single();

    if (dbError || !userRecord) {
      throw new Error("Usuário ou e-mail não encontrado.");
    }
    // Regra centralizada: Bloqueia o acesso se estiver inativo
    if (userRecord.is_active === false) {
      throw new Error("Esta conta está bloqueada. Contate o administrador.");
    }
    loginEmail = userRecord.email;
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

  if (authError) {
    if (authError.message.includes("Invalid login credentials")) {
      throw new Error("E-mail/Usuário ou senha incorretos.");
    }
    throw new Error("Falha na autenticação: " + authError.message);
  }

  // 3. Busca os dados públicos do usuário para colocar no JWT
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (userError || !userData) {
    throw new Error("Erro ao carregar o perfil do usuário.");
  }

  // Checagem de segurança final caso o usuário tenha sido banido enquanto estava digitando a senha
  if (userData.is_active === false) {
    throw new Error("Esta conta está bloqueada. Contate o administrador.");
  }

  return userData;
}

export default class AuthService {
  constructor() {
    // Constantes de tempo para garantir que JWT e Cookies tenham exatamente a mesma validade
    this.ACCESS_EXPIRES_IN = "15m";
    this.REFRESH_EXPIRES_IN = "7d";
    this.COOKIE_ACCESS_AGE = 15 * 60 * 1000;
    this.COOKIE_REFRESH_AGE = 7 * 24 * 60 * 60 * 1000;
  }

  getCookieOptions(maxAge) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: maxAge,
    };
  }

  async authenticateUser(identifier, password) {
    if (!password) throw new Error("A senha é obrigatória.");

    const isEmail = identifier.includes("@");
    let loginEmail = identifier.toLowerCase().trim();

    // 1. Descobrir o e-mail se o usuário digitou apenas o "username"
    if (!isEmail) {
      const { data: userRecord, error: dbError } = await supabaseAdmin
        .from("users")
        .select("email, is_active")
        .eq("name", identifier)
        .single();

      if (dbError || !userRecord) {
        throw new Error("Usuário ou e-mail não encontrado.");
      }
      // Regra centralizada: Bloqueia o acesso se estiver inativo
      if (userRecord.is_active === false) {
        throw new Error("Esta conta está bloqueada. Contate o administrador.");
      }
      loginEmail = userRecord.email;
    }

    // 2. Autenticação REAL E SEGURA utilizando o Supabase Auth (Criptografada)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        throw new Error("E-mail/Usuário ou senha incorretos.");
      }
      throw new Error("Falha na autenticação: " + authError.message);
    }

    // 3. Busca os dados públicos do usuário para colocar no JWT
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        supabaseError: userError,
        code: userError?.status || 500,
        error: "Erro ao carregar o perfil do usuário.",
      };
    }

    // Checagem de segurança final caso o usuário tenha sido banido enquanto estava digitando a senha
    if (userData.is_active === false) {
      return {
        success: false,
        code: 403,
        error: "Esta conta está bloqueada. Contate o administrador.",
      };
    }

    // 2. GERAÇÃO DOS TOKENS JWT
    const jwtPayload = {
      id: userData.id,
      name: userData.name,
      role: userData.role,
      avatar_url: userData.avatar_url || "",
    };

    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: this.ACCESS_EXPIRES_IN,
    });

    // O Refresh Token também carrega os dados básicos para não precisarmos bater no banco na hora de renovar
    const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
    });

    return {
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken,
        options: this.getCookieOptions(this.COOKIE_ACCESS_AGE),
      },
    };
  }
}
