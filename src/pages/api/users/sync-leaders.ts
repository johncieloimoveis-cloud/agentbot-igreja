import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const determineUserRole = async (groupId: string): Promise<string> => {
  const { data: group } = await adminClient
    .from('groups')
    .select('parent_group_id')
    .eq('id', groupId)
    .single();

  if (!group?.parent_group_id) {
    return '2a79ee87-5cf5-4e4d-91fa-8ca1e074d6cd'; // Querubim
  }
  return '3b80ff98-6dg6-5f5e-a2gb-9db185e7f8de'; // Serafim
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
    const email = person.email || `usuario.${personId.substring(0, 8)}@sheepcare.local`;

    // 1. Deletar de public.users primeiro (filho da FK)
    const { error: deletePublicError } = await adminClient
      .from('users')
      .delete()
      .eq('email', email);

    if (deletePublicError) {
      console.error('Erro ao deletar public.users:', deletePublicError);
      // Continua mesmo se falhar (pode não existir)
    }

    // 2. Buscar e deletar de auth.users (pai da FK)
    const { data: existingAuth, error: listError } = await adminClient.auth.admin.listUsers();
    if (!listError && existingAuth) {
      const existingUser = existingAuth.users.find(u => u.email === email);
      if (existingUser) {
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
          existingUser.id
        );
        if (deleteAuthError) {
          console.error('Erro ao deletar auth.users:', deleteAuthError);
        }
      }
    }

    // 3. Recriar em auth.users
    const { data: authData, error: createAuthError } =
      await adminClient.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-12), // temp password
        email_confirm: true,
      });

    if (createAuthError) throw createAuthError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // 4. Recriar em public.users
    const { error: createPublicError } = await adminClient
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: person.full_name,
          church_id: churchId,
          role_id: roleId,
          people_id: personId,
          is_active: true,
        },
      ]);

    if (createPublicError) throw createPublicError;

    return { data: { id: authData.user.id }, error: null, message: 'Usuário criado/atualizado' };
  } catch (err) {
    console.error('Erro em createUserForLeader:', err);
    return { error: err, message: 'Erro ao processar usuário' };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

    const { data: allGroups } = await adminClient
      .from('groups')
      .select('*')
      .eq('church_id', churchId);

    if (!allGroups) {
      return res.status(200).json({ message: 'Nenhum grupo encontrado', results: [] });
    }

    const leaders = allGroups.filter(g => g.leader_id);
    const uniqueLeaders = Array.from(new Map(leaders.map(l => [l.leader_id, l])).values());
    const results: any[] = [];

    for (const leader of uniqueLeaders) {
      try {
        const result = await createUserForLeader(leader.leader_id, leader.id, churchId);
        results.push({
          leader_id: leader.leader_id,
          success: !result.error,
          message: result.message,
          error: result.error ? (result.error instanceof Error ? result.error.message : String(result.error)) : null,
        });
      } catch (err) {
        results.push({
          leader_id: leader.leader_id,
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    const created = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(200).json({
      message: 'Sincronizacao concluida',
      created,
      failed,
      total: uniqueLeaders.length,
      results,
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
}
