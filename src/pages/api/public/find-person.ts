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

  const { phone, name, church_id } = req.query;

  if (!church_id || typeof church_id !== 'string') {
    return res.status(400).json({ error: 'church_id obrigatorio' });
  }

  // --- Busca por nome ---
  if (name && typeof name === 'string' && name.trim().length >= 3) {
    const nameTrimmed = name.trim();
    const words = nameTrimmed.split(/\s+/).filter(w => w.length >= 3);
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const allVariants = [...new Set([...words, ...words.map(norm)])];
    const orFilter = allVariants.map(w => `full_name.ilike.%${w}%`).join(',');

    const { data, error } = await supabaseAdmin
      .from('people')
      .select('id, full_name, email, oficial, date_of_birth, address, city, phone, whatsapp')
      .eq('church_id', church_id)
      .or(orFilter)
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(200).json({ person: null });

    const normLower = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const wordsNorm = words.map(normLower);
    const scored = data.map(p => {
      const nameNorm = normLower(p.full_name);
      const score = wordsNorm.filter(w => nameNorm.includes(w)).length;
      return { ...p, _score: score };
    }).sort((a, b) => b._score - a._score);

    const best = scored[0];
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
    .eq('church_id', church_id)
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
