import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

/** Remove acentos, cedilha e caracteres especiais */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Normaliza nome para username: "João Silva Neto" → "joao.silva" */
function toUsername(fullName: string): string {
  const parts = stripAccents(fullName)
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')  // só letras e espaços
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0] || 'usuario';
  const last  = parts.length > 1 ? parts[parts.length - 1] : '';
  return last ? `${first}.${last}` : first;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { personId, personName, oficialPosition } = req.body;
  if (!personId || !personName) {
    return res.status(400).json({ error: 'personId e personName são obrigatórios' });
  }

  // Verificar se é líder de algum grupo ativo
  const { data: ledGroups } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('leader_id', personId)
    .eq('status', 'active')
    .limit(1);

  const isGroupLeader = (ledGroups?.length ?? 0) > 0;

  // Posição oficial ou líder de grupo → Serafim; sem posição e sem grupo → Anjinho
  const posNorm = stripAccents(oficialPosition || '').toLowerCase().trim();
  const hasOfficialPosition = posNorm !== '' && posNorm !== 'nao';
  const targetRoleName = (hasOfficialPosition || isGroupLeader) ? 'Serafim' : 'Anjinho';

  // Verificar se já existe login para esta pessoa
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('people_id', personId)
    .maybeSingle();

  if (existingUser) {
    return res.status(409).json({
      error: `Esta pessoa já possui login: ${existingUser.email}`,
      email: existingUser.email,
    });
  }

  const baseUsername = toUsername(personName);
  const domain = 'sheepcare.local';
  const defaultPassword = 'Ibaiti@2026';

  // Evitar duplicatas no Auth: tentar username, depois username2, username3...
  let username = baseUsername;
  let email = `${username}@${domain}`;
  let attempt = 1;

  while (true) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const taken = (existing?.users as Array<{ email?: string | null }> ?? []).some((u) => u.email === email);
    if (!taken) break;
    attempt++;
    username = `${baseUsername}${attempt}`;
    email = `${username}@${domain}`;
    if (attempt > 10) {
      return res.status(409).json({ error: 'Não foi possível gerar um username único para este nome.' });
    }
  }

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      full_name: personName,
      person_id: personId,
      must_change_password: true,
    },
  });

  if (authError) return res.status(500).json({ error: authError.message });

  const authUserId = authData.user?.id;
  if (!authUserId) return res.status(500).json({ error: 'Usuário criado mas ID não retornado' });

  // 2. Buscar role correto
  const { data: roleData } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', targetRoleName)
    .single();

  const roleId = roleData?.id ?? null;

  // 3. Inserir na tabela users (mesmo id do Auth para getUserRole funcionar)
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authUserId,
      email,
      full_name: personName,
      church_id: CHURCH_ID,
      role_id: roleId,
      people_id: personId,
      is_active: true,
    });

  if (dbError) {
    // Rollback: deletar o Auth user criado
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return res.status(500).json({ error: `Erro ao salvar usuário no banco: ${dbError.message}` });
  }

  return res.status(200).json({
    success: true,
    username,
    email,
    password: defaultPassword,
    userId: authUserId,
  });
}
