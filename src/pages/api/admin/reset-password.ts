import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generatePassword(): string {
  const words = ['Pedra', 'Rocha', 'Monte', 'Vale', 'Rio', 'Mar', 'Sol', 'Cruz', 'Graca', 'Paz'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${word}@${num}`;
}

export default withAuth(
  ['Arcanjo', 'Querubim'],
  async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
    if (req.method !== 'POST') return res.status(405).end();

    const { personId } = req.body;
    if (!personId) return res.status(400).json({ error: 'personId obrigatório' });

    // Buscar usuário vinculado à pessoa
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('people_id', personId)
      .eq('church_id', user.church_id)
      .maybeSingle();

    if (userErr || !userRow) {
      return res.status(404).json({ error: 'Esta pessoa não possui login cadastrado.' });
    }

    const newPassword = generatePassword();

    // Atualizar senha e marcar must_change_password
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userRow.id, {
      password: newPassword,
      user_metadata: { must_change_password: true },
    });

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.status(200).json({
      success: true,
      email: userRow.email,
      password: newPassword,
    });
  }
);
