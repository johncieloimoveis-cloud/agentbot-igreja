import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export type UserRole = 'Arcanjo' | 'Querubim' | 'Serafim' | 'Anjinho';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  church_id: string;
  people_id: string | null;
  group_ids: string[]; // grupos que este usuario lidera
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function getAuthUser(req: NextApiRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('church_id, role_id, people_id')
    .eq('id', user.id)
    .single();

  if (!profile?.church_id) return null;

  let roleName: string | null = null;
  if (profile.role_id) {
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .single();
    roleName = roleData?.name ?? null;
  }

  if (!roleName) return null;

  // Busca os grupos que este usuario lidera (via people_id -> groups.leader_id)
  let group_ids: string[] = [];
  if (profile.people_id) {
    const { data: ledGroups } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('leader_id', profile.people_id)
      .eq('church_id', profile.church_id)
      .eq('status', 'active');
    group_ids = (ledGroups || []).map((g: any) => g.id);
  }

  return {
    id: user.id,
    email: user.email!,
    role: roleName as UserRole,
    church_id: profile.church_id,
    people_id: profile.people_id ?? null,
    group_ids,
  };
}

export function withAuth(
  allowedRoles: UserRole[],
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    user: AuthUser
  ) => Promise<unknown>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Sem permissao para esta acao' });
    }

    return handler(req, res, user);
  };
}
