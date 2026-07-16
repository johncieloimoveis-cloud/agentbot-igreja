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

    // GET — lista atualizados ou pendentes
    if (req.method === 'GET') {
      const { aba } = req.query;

      const base = supabaseAdmin
        .from('people')
        .select('id, full_name, phone, whatsapp, email, cadastro_atualizado_em, date_of_birth, address, address_number, city')
        .eq('church_id', user.church_id)
        .order('full_name');

      let query;
      if (aba === 'atualizados') {
        query = (base as any)
          .not('cadastro_atualizado_em', 'is', null)
          .order('cadastro_atualizado_em', { ascending: false });
      } else {
        query = (base as any).is('cadastro_atualizado_em', null);
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // PATCH — marca manualmente como atualizado
    if (req.method === 'PATCH') {
      const { id } = req.body as { id: string };
      if (!id) return res.status(400).json({ error: 'id obrigatorio' });

      // Confirma que a pessoa pertence à mesma igreja
      const { data: pessoa } = await supabaseAdmin
        .from('people')
        .select('id')
        .eq('id', id)
        .eq('church_id', user.church_id)
        .single();

      if (!pessoa) return res.status(404).json({ error: 'Pessoa nao encontrada' });

      const { error } = await supabaseAdmin
        .from('people')
        .update({ cadastro_atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  }
);
