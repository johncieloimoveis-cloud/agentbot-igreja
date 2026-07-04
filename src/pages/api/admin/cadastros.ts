import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

export default withAuth(
  ['Arcanjo', 'Querubim'],
  async (req: NextApiRequest, res: NextApiResponse, _user: AuthUser) => {
    if (req.method !== 'GET') return res.status(405).end();

    const { aba } = req.query; // 'atualizados' | 'pendentes'

    const base = supabaseAdmin
      .from('people')
      .select('id, full_name, phone, whatsapp, email, cadastro_atualizado_em')
      .eq('church_id', CHURCH_ID)
      .order('full_name');

    let query;
    if (aba === 'atualizados') {
      query = (base as any).not(
        'cadastro_atualizado_em',
        'is',
        null
      ).order('cadastro_atualizado_em', { ascending: false });
    } else {
      query = (base as any).is('cadastro_atualizado_em', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
);
