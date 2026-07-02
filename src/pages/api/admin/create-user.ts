import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Normaliza nome para username: "João Silva Neto" → "joao.silva" */
function toUsername(fullName: string): string {
  const parts = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove acentos
    .replace(/[^a-z\s]/g, '')           // só letras e espaços
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  // Usa primeiro + último nome (ou só o primeiro se nome único)
  const first = parts[0] || 'usuario';
  const last  = parts.length > 1 ? parts[parts.length - 1] : '';
  return last ? `${first}.${last}` : first;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { personId, personName } = req.body;
  if (!personId || !personName) {
    return res.status(400).json({ error: 'personId e personName são obrigatórios' });
  }

  const baseUsername = toUsername(personName);
  const domain = 'sheepcare';
  const defaultPassword = 'Ibaiti@2026';

  // Evitar duplicatas: tentar username, depois username2, username3...
  let username = baseUsername;
  let email = `${username}@${domain}`;
  let attempt = 1;

  while (true) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const taken = existing?.users?.some((u) => u.email === email);
    if (!taken) break;
    attempt++;
    username = `${baseUsername}${attempt}`;
    email = `${username}@${domain}`;
    if (attempt > 10) {
      return res.status(409).json({ error: 'Não foi possível gerar um username único para este nome.' });
    }
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,   // pula verificação por e-mail
    user_metadata: {
      full_name: personName,
      person_id: personId,
      must_change_password: true,
    },
  });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({
    success: true,
    username,      // ex: "joao.silva"
    email,         // ex: "joao.silva@sheepcare"
    password: defaultPassword,
    userId: data.user?.id,
  });
}
