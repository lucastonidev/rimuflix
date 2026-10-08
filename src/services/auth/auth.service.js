import { supabaseAdmin } from "../../config/supabase.js";

export async function authenticateUser(identifier, password) {
  const isEmail = identifier.includes("@");

  let query = supabaseAdmin.from("users").select("*");

  if (isEmail) {   
    query = query.eq("email", identifier.toLowerCase());
  } else {
    query = query.eq("name", identifier.toLowerCase());
  }

  const { data: user, error } = await query.single();

  if (error || !user) {
    throw new Error("Usuário ou e-mail não encontrado.");
  }

  if (user.password.toLowerCase() !== password.toLowerCase()) {
    throw new Error("Senha incorreta.");
  }

  if (user.is_active === false) {
    throw new Error("Esta conta está bloqueada. Contate o administrador.");
  }

  return user;
}
