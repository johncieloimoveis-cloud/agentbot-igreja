import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // Verifica o plano da igreja
  const { data: church } = await supabaseAdmin
    .from('churches')
    .select('plano')
    .eq('id', CHURCH_ID)
    .single();

  const plano = church?.plano || 'gratuito';

  // Igrejas pagantes não recebem banner
  if (plano === 'pagante') {
    return res.status(200).json({ plano, ad: null });
  }

  // Busca um anúncio em destaque ativo aleatório
  const { data: ads } = await supabaseAdmin
    .from('anuncios')
    .select('id, empresa, mensagem, contato')
    .eq('status', 'ativo')
    .eq('destaque', true);

  let ad = null;
  if (ads && ads.length > 0) {
    ad = ads[Math.floor(Math.random() * ads.length)];
  }

  return res.status(200).json({ plano, ad });
}
