import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { full_name, email, oficial, date_of_birth, address, city } = req.body;

  if (!full_name?.trim()) {
    return res.status(400).json({ error: 'Nome completo é obrigatório' });
  }

  const { error } = await supabaseAdmin.from('people').insert({
    full_name: full_name.trim(),
    email: email?.trim() || null,
    oficial: oficial || 'NÃO',
    date_of_birth: date_of_birth || null,
    address: address?.trim() || null,
    city: city?.trim() || null,
    status: 'active_member',
    church_id: CHURCH_ID,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
