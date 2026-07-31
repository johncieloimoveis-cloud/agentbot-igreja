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
    if (!user.church_id) return res.status(403).json({ error: 'Sem igreja associada' });

    // GET: retorna a configuração atual
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('churches')
        .select('slug, cadastro_ia_campos')
        .eq('id', user.church_id)
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ slug: data?.slug ?? '', campos: data?.cadastro_ia_campos ?? [] });
    }

    // POST: salva a configuração
    if (req.method === 'POST') {
      const { campos } = req.body;
      if (!Array.isArray(campos)) {
        return res.status(400).json({ error: 'campos deve ser um array' });
      }

      const { error } = await supabaseAdmin
        .from('churches')
        .update({ cadastro_ia_campos: campos })
        .eq('id', user.church_id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  }
);
