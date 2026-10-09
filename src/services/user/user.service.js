import { supabaseAdmin, supabase } from "../../config/supabase.js";
import jwt from "jsonwebtoken";

class UsersService {
  // ==========================================
  // SISTEMA DE LISTAS CUSTOMIZADAS E FAVORITOS
  // ==========================================
  async getUserLists(userId) {
    let { data: lists, error } = await supabaseAdmin
      .from("custom_lists")
      .select(
        `id, name, is_public, items:custom_list_items ( media_id, media_type )`,
      )
      .eq("user_id", userId);

    if (error) throw new Error("Erro ao buscar listas no banco.");

    const hasFavoritos = lists.some((list) => list.name === "Favoritos");
    if (!hasFavoritos) {
      const { data: newFav, error: favError } = await supabaseAdmin
        .from("custom_lists")
        .insert({ user_id: userId, name: "Favoritos", is_public: false })
        .select("id, name, is_public")
        .single();

      if (!favError && newFav) {
        newFav.items = [];
        lists.push(newFav);
      }
    }
    return lists;
  }

  async getListById(listId, token) {
    // 1. Busca os dados e os itens
    const { data: listData, error } = await supabaseAdmin
      .from("custom_lists")
      .select(
        `
        id, 
        user_id, 
        name, 
        is_public, 
        created_at,
        items:custom_list_items ( media_id, media_type )
      `,
      )
      .eq("id", listId)
      .single();

    if (error || !listData) {
      throw { status: 404, message: "Playlist não encontrada." };
    }

    // 👇 O PULO DO GATO: Se for PÚBLICA, o código salta este IF e nem sequer olha para o token.
    if (!listData.is_public) {
      if (!token) {
        throw {
          status: 401,
          message: "Esta playlist é privada. Inicie sessão para visualizar.",
        };
      }

      // Se for privada, valida a identidade
      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Garante que apanha o ID de qualquer formato que tenha usado no jwt.sign()
        userId = decoded.id || decoded.userId;
      } catch (err) {
        throw { status: 401, message: "Sessão inválida ou expirada." };
      }

      if (userId !== listData.user_id) {
        throw {
          status: 403,
          message: "Não tem permissão para visualizar esta playlist.",
        };
      }
    }

    // 3. Se for pública OU se for o dono da lista privada, devolve os dados
    return listData;
  }

  async createList(userId, name) {
    const { data, error } = await supabaseAdmin
      .from("custom_lists")
      .insert({ user_id: userId, name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        throw new Error("Você já possui uma lista com este nome.");
      throw new Error("Erro ao criar a lista.");
    }
    return data;
  }

  async deleteList(userId, listId) {
    const { data: listCheck } = await supabaseAdmin
      .from("custom_lists")
      .select("name")
      .eq("id", listId)
      .eq("user_id", userId)
      .single();

    if (!listCheck) throw new Error("Lista não encontrada.");
    if (listCheck.name === "Favoritos")
      throw new Error("A lista de Favoritos não pode ser apagada.");

    const { error } = await supabaseAdmin
      .from("custom_lists")
      .delete()
      .eq("id", listId);
    if (error) throw new Error("Erro ao apagar a lista.");
    return true;
  }

  async toggleListItem(userId, listId, mediaId, mediaType) {
    const { data: listOwner, error: ownerError } = await supabaseAdmin
      .from("custom_lists")
      .select("id")
      .eq("id", listId)
      .eq("user_id", userId)
      .single();

    if (ownerError || !listOwner) throw new Error("Lista inválida.");

    const { data: existingItem } = await supabaseAdmin
      .from("custom_list_items")
      .select("id")
      .eq("list_id", listId)
      .eq("media_id", String(mediaId))
      .eq("media_type", mediaType)
      .single();

    if (existingItem) {
      const { error } = await supabaseAdmin
        .from("custom_list_items")
        .delete()
        .eq("id", existingItem.id);
      if (error) throw new Error("Erro ao remover o item.");
      return "removed";
    } else {
      const { error } = await supabaseAdmin.from("custom_list_items").insert({
        list_id: listId,
        media_id: String(mediaId),
        media_type: mediaType,
      });
      if (error) throw new Error("Erro ao adicionar o item.");
      return "added";
    }
  }

  // Atualiza a visibilidade da lista (Pública/Privada)
  async updateListVisibility(userId, listId, isPublic) {
    const { data, error } = await supabaseAdmin
      .from("custom_lists")
      .update({ is_public: isPublic })
      .eq("id", listId)
      .eq("user_id", userId)
      .select("id, is_public")
      .single();

    if (error) throw new Error("Erro ao atualizar a privacidade da lista.");
    return data;
  }

  // ==========================================
  // SISTEMA DE PROGRESSO (CONTINUE WATCHING)
  // ==========================================
  async getWatchProgress(userId) {
    const { data, error } = await supabaseAdmin
      .from("watch_progress") // Ajuste se o nome da sua tabela for diferente
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error("Erro ao buscar progresso.");
    return data;
  }

  async saveWatchProgress(userId, payload) {
    const { tmdb_id, media_type, season_number, episode_number, stopped_at } =
      payload;

    // Verifica se já existe progresso para esta mídia
    const { data: existing } = await supabaseAdmin
      .from("watch_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("tmdb_id", String(tmdb_id))
      .single();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from("watch_progress")
        .update({
          season_number,
          episode_number,
          stopped_at,
          updated_at: new Date(),
        })
        .eq("id", existing.id);
    } else {
      result = await supabaseAdmin.from("watch_progress").insert({
        user_id: userId,
        tmdb_id: String(tmdb_id),
        media_type,
        season_number,
        episode_number,
        stopped_at,
      });
    }

    if (result.error) throw new Error("Erro ao salvar progresso.");
    return true;
  }

  async removeWatchProgress(userId, mediaType, tmdbId) {
    const { error } = await supabaseAdmin
      .from("watch_progress")
      .delete()
      .eq("user_id", userId)
      .eq("tmdb_id", String(tmdbId))
      .eq("media_type", mediaType);

    if (error) throw new Error("Erro ao remover progresso.");
    return true;
  }

  // ==========================================
  // PERFIL E CONFIGURAÇÕES
  // ==========================================
  async updateProfile(userId, payload) {
    const updates = {};
    if (payload.name) updates.name = payload.name;
    if (payload.email) updates.email = payload.email;
    if (payload.avatar_url) updates.avatar_url = payload.avatar_url;

    if (payload.newPassword) {
      if (payload.newPassword.length < 6) {
        throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
      }

      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: payload.newPassword,
        });

      if (authError) throw new Error(authError.message);
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, name, email, avatar_url, role")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ==========================================
  // SISTEMA DE AVALIAÇÕES (REVIEWS)
  // ==========================================
  async getMediaReviews(mediaType, tmdbId) {
    // 👇 O SEGREDO ESTÁ AQUI: Especificamos explicitamente a FK ou evitamos o join se o banco der erro.
    // Usaremos users:user_id(name) que diz para o Supabase: "Use a coluna user_id para buscar na tabela users o campo name"
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        users:user_id ( name, avatar_url )
      `,
      )
      .eq("media_type", mediaType)
      .eq("tmdb_id", String(tmdbId))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro explícito do banco em Reviews:", error);
      throw new Error("Erro ao buscar avaliações no banco.");
    }
    return data;
  }

  async addInternalReview(payload) {
    const { user_id, tmdb_id, media_type, rating, comment } = payload;

    // Verifica se já avaliou
    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("user_id", user_id)
      .eq("tmdb_id", String(tmdb_id))
      .eq("media_type", media_type)
      .single();

    if (existing) {
      // Atualiza a review
      const { error } = await supabaseAdmin
        .from("reviews")
        .update({
          rating,
          comment,
          updated_at: new Date(),
        })
        .eq("id", existing.id);
      if (error) throw new Error("Erro ao atualizar avaliação.");
    } else {
      // Cria a review
      const { error } = await supabaseAdmin.from("reviews").insert({
        user_id,
        tmdb_id: String(tmdb_id),
        media_type,
        rating,
        comment,
      });
      if (error) throw new Error("Erro ao salvar avaliação.");
    }
    return true;
  }
}

export default new UsersService();
