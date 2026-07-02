import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const { userId, full_name, email, role_id, is_active } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  const { error } = await supabaseAdmin
    .from('users')
    .update({ full_name, email, role_id, is_active })
    .eq('id', userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
