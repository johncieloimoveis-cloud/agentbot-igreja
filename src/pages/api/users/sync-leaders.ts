import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const getRoleIdByName = async (name: string): Promise<string | null> => {
  const { data, error } = await adminClient
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

const determineUserRole = async (groupId: string): Promise<string | null> => {
  const { data: group } = await adminClient
    .from('groups')
    .select('parent_group_id')
    .eq('id', groupId)
    .single();

  if (!group?.parent_group_id) {
    return await getRoleIdByName('Querubim');
  }
  return await getRoleIdByName('Serafim');
};

const createUserForLeader = async (
  personId: string,
  groupId: string,
  churchId: string
) => {
  try {
    const { data: person } = await adminClient
      .from('people')
      .select('id, full_name, email, phone')
      .eq('id', personId)
      .single();

    if (!person) throw new Error('Person not found');

    const roleId = await determineUserRole(groupId);
    if (!roleId) throw new Error('Role nao encontrada no banco de dados');
    const email = person.email || `usuario.${personId.substring(0, 8)}@sheepcare.local`;

    // 1. Deletar de public.users primeiro (filho da FK)
    const { error: deletePublicError } = await adminClient
      .from('users')
      .delete()
      .eq('email', email);

    if (deletePublicError) {
      console.error('Erro ao deletar public.users:', deletePublicError);
    }

    // 2. Buscar e deletar de auth.users (pai da FK)
    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
    if (!listError && listData?.users) {
      const existingUser = listData.users.find((u: any) => u.email === email);
      if (existingUser) {
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(existingUser.id);
        if (deleteAuthError) {
          console.error('Erro ao deletar auth.users:', deleteAuthError);
        }
      }
    }

    // 3. Recriar em auth.users
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
    });

    if (createAuthError) throw createAuthError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // 4. Recriar em public.users
    const { error: createPublicError } = await adminClient
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        full_name: person.full_name,
        church_id: churchId,
        role_id: roleId,
        people_id: personId,
        is_active: true,
      }]);

    if (createPublicError) throw createPublicError;

    return { data: { id: authData.user.id }, error: null, message: 'Usuario criado/atualizado' };
  } catch (err) {
    console.error('Erro em createUserForLeader:', err);
    return { error: err, message: 'Erro ao processar usuario' };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const churchId = process.env.DEFAULT_CHURCH_ID || '';  // TODO Fase 2: resolver por auth

    const { data: allGroups } = await adminClient
      .from('groups')
      .select('*')
      .eq('church_id', churchId);

    if (!allGroups) {
      return res.status(200).json({ message: 'Nenhum grupo encontrado', results: [] });
    }

    const leaders = allGroups.filter((g: any) => g.leader_id);
    const uniqueLeaders = Array.from(
      new Map(leaders.map((l: any) => [l.leader_id, l])).values()
    ) as any[];
    const results: any[] = [];

    for (const leader of uniqueLeaders) {
      try {
        const result = await createUserForLeader(leader.leader_id, leader.id, churchId);
        results.push({
          leader_id: leader.leader_id,
          success: !result.error,
          message: result.message,
          error: result.error
            ? result.error instanceof Error
              ? result.error.message
              : String(result.error)
            : null,
        });
      } catch (err) {
        results.push({
          leader_id: leader.leader_id,
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    const created = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return res.status(200).json({
      message: 'Sincronizacao concluida',
      created,
      failed,
      total: uniqueLeaders.length,
      results,
    });
  } catch (error) {
    console.error('Erro na sincronizacao:', error);
    return res.status(500).json({ error: 'Erro ao sincronizar' });
  }
}
