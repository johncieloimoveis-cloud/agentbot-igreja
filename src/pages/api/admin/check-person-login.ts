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

    const { personId } = req.query;
    if (!personId) return res.status(400).json({ error: 'personId obrigatorio' });

    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('people_id', personId as string)
      .eq('church_id', user.church_id)
      .maybeSingle();

    return res.status(200).json({ hasLogin: !!data });
  }
);
