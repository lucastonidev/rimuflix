import { supabase, supabaseAdmin } from "../../config/supabase.js";

export async function authenticateUser(identifier, password) {
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
    throw new Error("Erro ao carregar o perfil do usuário.");
  }

  // Checagem de segurança final caso o usuário tenha sido banido enquanto estava digitando a senha
  if (userData.is_active === false) {
    throw new Error("Esta conta está bloqueada. Contate o administrador.");
  }

  return userData;
}
