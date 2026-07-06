import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export type UserRole = 'Arcanjo' | 'Querubim' | 'Serafim' | 'Anjinho';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  church_id: string;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Valida o Bearer token do header Authorization e retorna o usuário
 * com seu role. Usa service role para contornar RLS na tabela users.
 */
export async function getAuthUser(req: NextApiRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('church_id, role_id')
    .eq('id', user.id)
    .single();

  if (!profile?.church_id) return null;

  // Lê o role sempre da tabela roles via role_id (fonte da verdade)
  // Assim, alterações de role via UI valem imediatamente sem sync manual
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

  return {
    id: user.id,
    email: user.email!,
    role: roleName as UserRole,
    church_id: profile.church_id,
  };
}

/**
 * Middleware para proteger API routes por role.
 *
 * Uso:
 *   export default withAuth(['admin'], async (req, res, user) => { ... });
 *
 * Passa array vazio [] para exigir apenas autenticação (qualquer role).
 */
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
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }

    return handler(req, res, user);
  };
}
