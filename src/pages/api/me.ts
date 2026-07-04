import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/withAuth';

/**
 * GET /api/me
 * Retorna o perfil do usuário autenticado: id, email, role, church_id.
 * Usado pelo AuthContext para popular role e church_id sem depender do RLS.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  return res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
    church_id: user.church_id,
  });
}
