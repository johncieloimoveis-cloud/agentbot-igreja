import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { church_id } = req.query;
  if (!church_id || typeof church_id !== 'string') {
    return res.status(400).json({ error: 'church_id obrigatorio' });
  }

  const { data, error } = await supabaseAdmin
    .from('anuncios')
    .select('id, empresa, mensagem')
    .eq('church_id', church_id)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ anuncios: data || [] });
}
