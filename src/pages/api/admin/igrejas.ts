import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default withAuth(
  ['Arcanjo'],
  async (req: NextApiRequest, res: NextApiResponse, _user: AuthUser) => {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('churches')
        .select('id, name, plano, people_limit')
        .order('name');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, plano, people_limit } = req.body;
      if (!id) return res.status(400).json({ error: 'id obrigatorio' });

      const update: Record<string, unknown> = {};
      if (plano !== undefined) {
        if (!['gratuito', 'pagante'].includes(plano)) {
          return res.status(400).json({ error: 'plano invalido' });
        }
        update.plano = plano;
      }
      if (people_limit !== undefined) {
        const limit = parseInt(people_limit, 10);
        if (isNaN(limit) || limit < 1) {
          return res.status(400).json({ error: 'people_limit invalido' });
        }
        update.people_limit = limit;
      }

      const { error } = await supabaseAdmin
        .from('churches')
        .update(update)
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  }
);
