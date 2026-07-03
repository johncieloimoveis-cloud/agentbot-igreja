import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST = novo cadastro, PATCH = atualiza existente
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).end();

  const { id, full_name, email, oficial, date_of_birth, address, city, phone, whatsapp } = req.body;

  if (!full_name?.trim()) {
    return res.status(400).json({ error: 'Nome completo é obrigatório' });
  }

  const payload = {
    full_name: full_name.trim(),
    email: email?.trim() || null,
    oficial: oficial || 'NÃO',
    date_of_birth: date_of_birth || null,
    address: address?.trim() || null,
    city: city?.trim() || null,
    phone: phone?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
    cadastro_atualizado_em: new Date().toISOString(),
  };

  if (req.method === 'PATCH') {
    // Atualiza registro existente
    if (!id) return res.status(400).json({ error: 'ID é obrigatório para atualização' });

    const { error } = await supabaseAdmin
      .from('people')
      .update(payload)
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, updated: true });
  }

  // POST — cria novo registro
  const { error } = await supabaseAdmin.from('people').insert({
    ...payload,
    status: 'active_member',
    church_id: CHURCH_ID,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, created: true });
}
