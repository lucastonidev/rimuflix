import { supabase } from "../../config/supabase.js";

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);
  return data;
};

export const toggleUserStatus = async (userId, currentStatus) => {
  // Inverte o status atual (se era true, vira false e vice-versa)
  const { data, error } = await supabase
    .from("users")
    .update({ is_active: !currentStatus })
    .eq("id", userId)
    .select();

  if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
  return data[0];
};

export const createUser = async ({ email, password, name, role }) => {
  // Exemplo de como deve ficar a lógica no seu Backend (Node.js)

  // 1. Cria o usuário no Auth (Authentication)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { name: name, role: role }, // Passando os meta dados
    });

  if (authError) {
    throw new Error(`Erro ao criar usuário: ${authError.message}`);
  }

  // 2. Com o usuário criado no Auth, nós INSERIMOS ele na tabela public.users
  const { error: dbError } = await supabase.from("users").insert([
    {
      id: authData.user.id, // ID gerado pelo Auth
      email: email,
      name: name,
      role: role,
    },
  ]);

  if (dbError) {
    throw new Error(`Erro ao criar usuário: ${dbError.message}`);
  }

  // Sucesso!
  return authData.user;
};;