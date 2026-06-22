import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

const getRoleIdByName = async (name: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', name)
    .single();
  if (error) {
    console.error(`Erro ao buscar role "${name}":`, error);
    return null;
  }
  return data?.id ?? null;
};

export const determineUserRole = async (groupId: string): Promise<string | null> => {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .select('parent_group_id')
      .eq('id', groupId)
      .single();
    if (error) throw error;

    if (!group?.parent_group_id) {
      return await getRoleIdByName('Querubim');
    }
    return await getRoleIdByName('Serafim');
  } catch (err) {
    console.error('Erro ao determinar role:', err);
    return await getRoleIdByName('Serafim');
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
    if (!roleId) throw new Error('Role nao encontrada no banco de dados');

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('people_id', personId)
      .single();

    if (existingUser) {
      const adminClient = getAdminClient();
      const { error: deleteError } = await adminClient
        .from('users')
        .delete()
        .eq('id', existingUser.id);

      if (deleteError) {
        console.error('Erro ao deletar usuario:', deleteError);
        return { error: new Error(`Delete failed: ${deleteError.message}`), message: 'Erro ao deletar' };
      }
    }

    const adminClient = getAdminClient();
    const email = person.email || `usuario.${personId.substring(0, 8)}@sheepcare.local`;
    const { data: newUser, error: createError } = await adminClient
      .from('users')
      .insert([{
        email,
        full_name: person.full_name,
        church_id: churchId,
        role_id: roleId,
        people_id: personId,
        is_active: true,
      }])
      .select()
      .single();
    if (createError) throw createError;
    return { data: newUser, error: null, message: 'Usuario criado com sucesso' };
  } catch (err) {
    console.error('Erro ao criar usuario:', err);
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
    console.error('Erro ao deletar usuario:', err);
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
