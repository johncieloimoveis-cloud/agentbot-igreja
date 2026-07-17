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
    if (req.method !== 'POST') return res.status(405).end();

    const { id, action } = req.body as { id: string; action: 'approve' | 'reject' };
    if (!id || !action) return res.status(400).json({ error: 'id e action obrigatorios' });

    // Garante que a pessoa pertence a esta igreja e tem pendencia
    const { data: pessoa } = await supabaseAdmin
      .from('people')
      .select('id, portal_pendente')
      .eq('id', id)
      .eq('church_id', user.church_id)
      .single();

    if (!pessoa) return res.status(404).json({ error: 'Pessoa nao encontrada' });
    if (!pessoa.portal_pendente) return res.status(400).json({ error: 'Sem atualizacao pendente' });

    if (action === 'approve') {
      const { submetido_em, ...dadosNovos } = pessoa.portal_pendente as Record<string, any>;
      const { error } = await supabaseAdmin
        .from('people')
        .update({ ...dadosNovos, portal_pendente: null })
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, approved: true });
    }

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('people')
        .update({ portal_pendente: null })
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, rejected: true });
    }

    return res.status(400).json({ error: 'action invalida' });
  }
);
