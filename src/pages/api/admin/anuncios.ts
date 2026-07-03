import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { empresa, mensagem, contato, status } = req.body;
    if (!empresa?.trim() || !mensagem?.trim()) {
      return res.status(400).json({ error: 'Empresa e mensagem são obrigatórios' });
    }
    const { error } = await supabaseAdmin.from('anuncios').insert({
      empresa: empresa.trim(),
      mensagem: mensagem.trim().slice(0, 120),
      contato: contato?.trim() || null,
      status: status || 'ativo',
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('anuncios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id e status são obrigatórios' });
    const { error } = await supabaseAdmin.from('anuncios').update({ status }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    const { error } = await supabaseAdmin.from('anuncios').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
