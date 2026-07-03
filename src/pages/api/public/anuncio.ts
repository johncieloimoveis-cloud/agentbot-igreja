import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { empresa, mensagem, contato } = req.body;

  if (!empresa?.trim() || !mensagem?.trim()) {
    return res.status(400).json({ error: 'Empresa e mensagem são obrigatórios' });
  }

  const { error } = await supabaseAdmin.from('anuncios').insert({
    empresa: empresa.trim(),
    mensagem: mensagem.trim().slice(0, 120),
    contato: contato?.trim() || null,
    status: 'pendente',
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
