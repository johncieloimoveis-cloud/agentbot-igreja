import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const church_id = user?.church_id;
  if (!church_id) return res.status(403).json({ error: 'Sem igreja associada' });

  const allowed = ['logo_url', 'instagram', 'facebook', 'youtube', 'website', 'whatsapp', 'city', 'pastor', 'address'];
  const body = req.body as Record<string, string>;
  const updates: Record<string, string | null> = {};

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key] === '' ? null : body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  }

  const { error } = await supabaseAdmin
    .from('churches')
    .update(updates)
    .eq('id', church_id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}

export default withAuth(['Arcanjo'], handler);
