import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/withAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Nao autenticado' });

  return res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
    church_id: user.church_id,
    people_id: user.people_id,
    group_ids: user.group_ids,
  });
}
