import { supabase } from './supabase';
export const determineUserRole = async (groupId: string): Promise<string> => {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .select('parent_group_id')
      .eq('id', groupId)
      .single();
    if (error) throw error;
    // Querubim: líder de grupo raiz (sem parent_group_id)
    if (!group?.parent_group_id) {
      return '2a79ee87-5cf5-4e4d-91fa-8ca1e074d6cd'; // Querubim
    }
    // Serafim: líder de subgrupo (com parent_group_id)
    return '3b80ff98-6dg6-5f5e-a2gb-9db185e7f8de'; // Serafim
  } catch (err) {
    console.error('Erro ao determinar role:', err);
    return '3b80ff98-6dg6-5f5e-a2gb-9db185e7f8de'; // Padrão para Serafim
  }
};
export const createUserForLeader = async (personId: string, groupId: string, churchId: string) => {
  try {
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('id, full_name, email, phone')
      .eq('id', personId)
      .single();
    if (personError) throw personError;

    const roleId = await determineUserRole(groupId);

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('people_id', personId)
      .single();

    if (existingUser) {
      // Atualizar role do usuário existente
      const { error: updateError } = await supabase
        .from('users')
        .update({ role_id: roleId })
        .eq('people_id', personId);

      if (updateError) throw updateError;
      return { data: existingUser, message: 'Usuário atualizado' };
    }

    // Criar novo usuário
    const email = person.email || `usuario.${personId.substring(0, 8)}@sheepcare.local`;
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name: person.full_name,
          church_id: churchId,
          role_id: roleId,
          people_id: personId,
          is_active: true,
        },
      ])
      .select()
      .single();
    if (createError) throw createError;
    return { data: newUser, message: 'Usuário criado com sucesso' };
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return { error: err };
  }
};
export const deleteUserForLeader = async (personId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('people_id', personId);
    if (error) throw error;
    return { data: { success: true } };
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    return { error: err };
  }
};
export const syncUserWithLeaderStatus = async (
  personId: string,
  isLeader: boolean,
  groupId?: string,
  churchId?: string
) => {
  if (isLeader && groupId && churchId) {
    return await createUserForLeader(personId, groupId, churchId);
  } else if (!isLeader) {
    return await deleteUserForLeader(personId);
  }
};
