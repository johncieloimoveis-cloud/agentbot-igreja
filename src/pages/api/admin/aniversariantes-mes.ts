import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default withAuth(
  ['Arcanjo', 'Querubim'],
  async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
    if (req.method !== 'GET') return res.status(405).end();

    const currentMonth = new Date().getMonth() + 1;

    const { data, error } = await supabaseAdmin
      .from('people')
      .select('id, full_name, date_of_birth, phone, whatsapp')
      .eq('church_id', user.church_id)
      .eq('is_active', true)
      .not('date_of_birth', 'is', null);

    if (error) return res.status(500).json({ error: error.message });

    const aniversariantes = (data || [])
      .map((p: any) => {
        const parts = p.date_of_birth.split('T')[0].split('-').map(Number);
        return { ...p, birth_month: parts[1], birth_day: parts[2] };
      })
      .filter((p: any) => p.birth_month === currentMonth)
      .sort((a: any, b: any) => a.birth_day - b.birth_day);

    return res.status(200).json(aniversariantes);
  }
);
