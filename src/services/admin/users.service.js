import { supabaseAdmin } from "../../config/supabase.js"; // 👈 Alterado para supabaseAdmin

// 1. BUSCAR TODOS OS USUÁRIOS (Ignorando RLS)
export const getAllUsers = async () => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);
  return data;
};

// 2. BLOQUEAR / DESBLOQUEAR USUÁRIO
export const toggleUserStatus = async (userId, currentStatus) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ is_active: !currentStatus })
    .eq("id", userId)
    .select();

  if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
  return data[0];
};

// 3. CRIAR NOVO USUÁRIO (Sincronizado com Auth)
export const createUser = async ({ name, email, role, password }) => {
  if (!name || !name.trim()) return { success: false, error: "O campo Nome é obrigatório." };
  if (!email || !email.trim()) return { success: false, error: "O campo E-mail é obrigatório." };
  if (!password || !password.trim()) return { success: false, error: "O campo Senha é obrigatório." };

  if (password.length < 6) {
    return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Forneça um endereço de e-mail válido." };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // A) Cria na tabela interna do Supabase (Auth) usando God Mode
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name.toLowerCase().trim(),
        role: role || "member",
      },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.status === 422) {
        return { success: false, error: "Este e-mail já está registrado no sistema." };
      }
      return { success: false, error: `Falha na autenticação: ${authError.message}` };
    }

    const newUserId = authData.user.id;

    // B) Usa UPSERT para garantir que a linha será salva mesmo se um trigger já tiver criado ela
    const { data, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert([
        {
          id: newUserId,
          name: name.trim(),
          email: cleanEmail,
          role: role || "member",
          password: password, // Mantemos aqui apenas por conveniência do painel admin
          is_active: true,
        },
      ], { onConflict: 'id' }) // 👈 O segredo está aqui! Ele previne o erro de duplicação.
      .select();

    if (dbError) {
      // Se houver erro, a gente tenta apagar o usuário do Auth para não deixar "fantasmas"
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return { success: false, error: `Erro ao salvar perfil público: ${dbError.message}` };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Erro interno no createUser:", error);
    return { success: false, error: "Erro interno no servidor ao tentar criar o usuário." };
  }
};

// 4. ATUALIZAR USUÁRIO (Senhas e Dados)
export const updateUser = async (userId, { name, email, role, password }) => {
  try {
    // A) Atualiza o Auth do Supabase (Senhas, Emails e Metadados)
    const authUpdates = {};
    if (email) authUpdates.email = email.trim().toLowerCase();

    if (name) {
      authUpdates.user_metadata = { name: name.trim() };
    }

    // Se o admin preencheu o campo de senha, altera a senha de login real do usuário
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return {
          success: false,
          error: "A nova senha deve ter pelo menos 6 caracteres.",
        };
      }
      authUpdates.password = password.trim();
    }

    // Aplica as mudanças no Auth
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);

      if (authError) {
        if (authError.message.includes("already registered")) {
          return {
            success: false,
            error: "Este e-mail já está em uso por outra conta.",
          };
        }
        return {
          success: false,
          error: `Falha ao atualizar acesso: ${authError.message}`,
        };
      }
    }

    // B) Atualiza a tabela pública 'users'
    const publicUpdates = {};
    if (name) publicUpdates.name = name.trim();
    if (email) publicUpdates.email = email.trim().toLowerCase();
    if (role) publicUpdates.role = role;
    if (password && password.trim().length > 0) {
      publicUpdates.password = password.trim(); // Atualiza a senha visual do painel
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("users")
      .update(publicUpdates)
      .eq("id", userId)
      .select();

    if (dbError) {
      if (dbError.code === "23505") {
        return {
          success: false,
          error: "Este e-mail já existe na tabela de perfis.",
        };
      }
      return {
        success: false,
        error: `Erro no banco de dados: ${dbError.message}`,
      };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Erro interno no updateUser:", error);
    return {
      success: false,
      error: "Erro interno no servidor ao tentar atualizar o usuário.",
    };
  }
};
