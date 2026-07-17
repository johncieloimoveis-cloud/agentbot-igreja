import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'slug obrigatorio' });
  }

  const { data, error } = await supabaseAdmin
    .from('churches')
    .select('id, name, slug, logo_url, city, pastor, address, instagram, facebook, youtube, website, whatsapp')
    .eq('slug', slug.toLowerCase().trim())
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Igreja nao encontrada' });
  }

  return res.status(200).json({ church: data });
}
