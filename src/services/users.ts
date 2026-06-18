import { supabase } from './supabase';

// Listar usuários da church
export const getUsers = async (churchId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role_id,
      roles:role_id(id, name, description),
      is_active,
      last_login,
      created_at
    `)
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });

  if (error) return { error };
  return { data };
};

// Obter usuário por ID
export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role_id,
      roles:role_id(id, name),
      is_active,
      created_at
    `)
    .eq('id', userId)
    .single();

  if (error) return { error };
  return { data };
};

// Atualizar usuário
export const updateUser = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) return { error };
  return { data };
};

// Deletar usuário (apenas se não for Arcanjo)
export const deleteUser = async (userId: string) => {
  // Verificar se é Arcanjo
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('role_id, roles:role_id(name)')
    .eq('id', userId)
    .single() as any;

  if (fetchError) return { error: fetchError };
  const roleName = Array.isArray(user?.roles) ? user?.roles[0]?.name : user?.roles?.name;
  if (roleName === 'Arcanjo') {
    return { error: new Error('Não é possível deletar um Arcanjo') };
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) return { error };
  return { data: { success: true } };
};

// Convidar novo usuário (via email)
export const inviteUser = async (email: string, full_name: string, roleId: string, churchId: string) => {
  try {
    const response = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name, roleId, churchId }),
    });

    const data = await response.json();
    if (!response.ok) return { error: new Error(data.message) };
    return { data };
  } catch (error) {
    return { error };
  }
};

// Obter role do usuário
export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('roles:role_id(name)')
    .eq('id', userId)
    .single() as any;

  if (error) return { error };
  const roleName = Array.isArray(data?.roles) ? data?.roles[0]?.name : data?.roles?.name;
  return { data: roleName };
};

// Verificar se usuário é Arcanjo
export const isArcanjo = async (userId: string) => {
  const { data, error } = await getUserRole(userId);
  if (error) return false;
  return data === 'Arcanjo';
};

// Verificar se usuário é Querubim
export const isQuerubim = async (userId: string) => {
  const { data, error } = await getUserRole(userId);
  if (error) return false;
  return data === 'Querubim' || data === 'Arcanjo';
};
