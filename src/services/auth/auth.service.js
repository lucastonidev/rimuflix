import { supabase } from "../../config/supabase.js";

export async function authenticateUser(identifier, password) {
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
    throw new Error("Usuário ou e-mail não encontrado.");
  }

  // 👇 A TRAVA QUE FALTAVA: Compara a senha do banco com a digitada
  console.log(`Comparando senha do banco: ${user.password} com a digitada: ${password}`);
  console.log("DADOS DO USUÁRIO RETORNADO PELO SUPABASE:", user);
  
  if (user.password !== password) {
    throw new Error("Senha incorreta.");
  }

  // Verifica se a conta está bloqueada
  if (user.is_active === false) {
    throw new Error("Esta conta está bloqueada. Contate o administrador.");
  }

  return user;
}