import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).end();

  const { id, church_id, full_name, email, oficial, date_of_birth, address, city, phone, whatsapp } = req.body;

  if (!full_name?.trim()) {
    return res.status(400).json({ error: 'Nome completo e obrigatorio' });
  }
  if (!church_id) {
    return res.status(400).json({ error: 'church_id e obrigatorio' });
  }

  const payload = {
    full_name: full_name.trim(),
    email: email?.trim() || null,
    oficial: oficial || 'NAO',
    date_of_birth: date_of_birth || null,
    address: address?.trim() || null,
    city: city?.trim() || null,
    phone: phone?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
    cadastro_atualizado_em: new Date().toISOString(),
  };

  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ error: 'ID e obrigatorio para atualizacao' });
    const { error } = await supabaseAdmin
      .from('people')
      .update(payload)
      .eq('id', id)
      .eq('church_id', church_id); // garante que o id pertence a esta igreja
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, updated: true });
  }

  // POST — cria novo registro
  const { error } = await supabaseAdmin.from('people').insert({
    ...payload,
    status: 'active_member',
    church_id,
  });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, created: true });
}
