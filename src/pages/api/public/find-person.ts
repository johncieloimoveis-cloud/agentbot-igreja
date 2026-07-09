import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

function stripDigits(s: string): string {
  return s.replace(/\D/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { phone, name } = req.query;

  // --- Busca por nome ---
  if (name && typeof name === 'string' && name.trim().length >= 3) {
    const nameTrimmed = name.trim();
    const words = nameTrimmed.split(/\s+/).filter(w => w.length >= 3);

    // Busca por cada palavra do nome (OR entre palavras, AND implicito via filtro JS)
    const orFilter = words.map(w => `full_name.ilike.%${w}%`).join(',');

    const { data, error } = await supabaseAdmin
      .from('people')
      .select('id, full_name, email, oficial, date_of_birth, address, city, phone, whatsapp')
      .eq('church_id', CHURCH_ID)
      .or(orFilter)
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(200).json({ person: null });

    // Prioriza quem tem mais palavras coincidindo
    const scored = data.map(p => {
      const nameLower = p.full_name.toLowerCase();
      const score = words.filter(w => nameLower.includes(w.toLowerCase())).length;
      return { ...p, _score: score };
    }).sort((a, b) => b._score - a._score);

    const best = scored[0];
    // Retorna apenas se ao menos 2 palavras coincidirem (ou nome com 1 palavra unica)
    if (best._score >= Math.min(2, words.length)) {
      const { _score, ...person } = best;
      return res.status(200).json({ person });
    }
    return res.status(200).json({ person: null });
  }

  // --- Busca por telefone ---
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'phone ou name e obrigatorio' });
  }

  const digits = stripDigits(phone);
  if (digits.length < 8) {
    return res.status(400).json({ error: 'Numero muito curto' });
  }

  const last9 = digits.slice(-9);
  const last8 = digits.slice(-8);
  const dashLast9 = last9.length === 9 ? `${last9.slice(0, 5)}-${last9.slice(5)}` : null;
  const dashLast8 = `${last8.slice(0, 4)}-${last8.slice(4)}`;

  // Padrao brasileiro: +55 43 9 XXXX-XXXX (espaco apos DDD, digito 9 separado)
  const spaceAt1Last9 = last9.length === 9
    ? `${last9[0]} ${last9.slice(1, 5)}-${last9.slice(5)}`
    : null;

  const filters = [
    `phone.ilike.%${last9}%`,
    `whatsapp.ilike.%${last9}%`,
    `phone.ilike.%${last8}%`,
    `whatsapp.ilike.%${last8}%`,
    ...(dashLast9 ? [`phone.ilike.%${dashLast9}%`, `whatsapp.ilike.%${dashLast9}%`] : []),
    ...(spaceAt1Last9 ? [`phone.ilike.%${spaceAt1Last9}%`, `whatsapp.ilike.%${spaceAt1Last9}%`] : []),
    `phone.ilike.%${dashLast8}%`,
    `whatsapp.ilike.%${dashLast8}%`,
  ];

  const { data, error } = await supabaseAdmin
    .from('people')
    .select('id, full_name, email, oficial, date_of_birth, address, city, phone, whatsapp')
    .or(filters.join(','))
    .limit(5);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(200).json({ person: null });

  const best = data.find(p => {
    const pDigits = stripDigits(p.phone || '') || stripDigits(p.whatsapp || '');
    return pDigits.endsWith(last9) || pDigits.endsWith(last8);
  }) || data[0];

  return res.status(200).json({ person: best });
}
