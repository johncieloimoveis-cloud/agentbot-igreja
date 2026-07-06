import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default withAuth(
  ['Arcanjo', 'Querubim', 'Serafim'],
  async (req: NextApiRequest, res: NextApiResponse, _user: AuthUser) => {
    if (req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { membershipId } = req.body;
    if (!membershipId) {
      return res.status(400).json({ error: 'membershipId é obrigatório' });
    }

    const { error } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('id', membershipId);

    if (error) {
      console.error('Erro ao remover membro:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }
);
