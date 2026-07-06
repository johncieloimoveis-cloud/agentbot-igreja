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
  async (req: NextApiRequest, res: NextApiResponse, caller: AuthUser) => {
    if (req.method !== 'PATCH') return res.status(405).end();

    const { userId, full_name, email, role_id, is_active } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

    // Querubim não pode editar nem promover Arcanjo
    if (caller.role === 'Querubim') {
      const { data: arcanjoRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'Arcanjo')
        .single();

      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('role_id')
        .eq('id', userId)
        .single();

      if (targetUser?.role_id === arcanjoRole?.id) {
        return res.status(403).json({ error: 'Querubim não pode editar um Arcanjo' });
      }
      if (role_id && role_id === arcanjoRole?.id) {
        return res.status(403).json({ error: 'Querubim não pode promover alguém a Arcanjo' });
      }
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ full_name, email, role_id, is_active })
      .eq('id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
);
