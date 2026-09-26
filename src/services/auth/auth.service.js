import { supabase } from "../../config/supabase.js";

export async function authenticateUser(identifier) {
  // Verifica se o identificador recebido é um e-mail
  const isEmail = identifier.includes("@");

  // Inicia a query base no Supabase
  let query = supabase.from("users").select("*");

  // Direciona a busca para a coluna correta
  if (isEmail) {
    query = query.eq("email", identifier);
  } else {
    query = query.eq("name", identifier);
  }

  // Executa a busca esperando um único resultado
  const { data: user, error } = await query.single();

  if (error || !user) {
    // Mensagem de erro atualizada para abranger ambos os casos
    throw new Error("Usuário ou e-mail incorreto.");
  }

  // Verifica se a conta está bloqueada (baseado no seu painel admin anterior)
  if (user.is_active === false) {
    throw new Error("Esta conta está bloqueada. Contate o administrador.");
  }

  return user;
}
