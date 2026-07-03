import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function stripDigits(s: string): string {
  return s.replace(/\D/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { phone } = req.query;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'phone é obrigatório' });
  }

  const digits = stripDigits(phone);
  if (digits.length < 8) {
    return res.status(400).json({ error: 'Número muito curto' });
  }

  // Tenta os últimos 9 dígitos (celular com 9) e 8 (fixo/celular antigo)
  const last9 = digits.slice(-9);
  const last8 = digits.slice(-8);

  // Busca nos campos phone e whatsapp usando ILIKE com os dígitos como substring
  // Funciona para números armazenados sem formatação (ex: "43999999999")
  // Para números com formatação, tenta também o sufixo com traço
  const dashLast9 = last9.length === 9 ? `${last9.slice(0, 5)}-${last9.slice(5)}` : null;
  const dashLast8 = `${last8.slice(0, 4)}-${last8.slice(4)}`;

  const filters = [
    `phone.ilike.%${last9}%`,
    `whatsapp.ilike.%${last9}%`,
    `phone.ilike.%${last8}%`,
    `whatsapp.ilike.%${last8}%`,
    ...(dashLast9 ? [`phone.ilike.%${dashLast9}%`, `whatsapp.ilike.%${dashLast9}%`] : []),
    `phone.ilike.%${dashLast8}%`,
    `whatsapp.ilike.%${dashLast8}%`,
  ];

  const { data, error } = await supabaseAdmin
    .from('people')
    .select('id, full_name, email, oficial, date_of_birth, address, city, phone, whatsapp')
    .or(filters.join(','))
    .limit(5);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(200).json({ person: null });
  }

  // Se encontrou mais de um, tenta escolher o mais próximo comparando os dígitos
  const best = data.find(p => {
    const pDigits = stripDigits(p.phone || '') || stripDigits(p.whatsapp || '');
    return pDigits.endsWith(last9) || pDigits.endsWith(last8);
  }) || data[0];

  return res.status(200).json({ person: best });
}
