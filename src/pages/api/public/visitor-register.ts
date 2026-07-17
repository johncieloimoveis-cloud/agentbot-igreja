import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    slug, full_name, phone, whatsapp,
    caminhada_espiritual, interesse_comunidade, como_apoiar, pedido_oracao,
  } = req.body;

  if (!full_name?.trim()) return res.status(400).json({ error: 'Nome obrigatorio' });
  if (!slug) return res.status(400).json({ error: 'slug obrigatorio' });

  // Resolve slug -> church_id
  const { data: church } = await supabaseAdmin
    .from('churches')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!church) return res.status(404).json({ error: 'Igreja nao encontrada' });

  const { error } = await supabaseAdmin.from('people').insert({
    church_id: church.id,
    full_name: full_name.trim(),
    phone: phone?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
    status: 'visitor',
    is_active: true,
    caminhada_espiritual: caminhada_espiritual || null,
    interesse_comunidade: interesse_comunidade || null,
    como_apoiar: como_apoiar || null,
    pedido_oracao: pedido_oracao?.trim() || null,
    cadastro_atualizado_em: new Date().toISOString(),
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
