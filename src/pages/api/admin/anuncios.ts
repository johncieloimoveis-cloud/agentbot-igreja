import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthUser } from '@/lib/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default withAuth(
  ['admin'],
  async (req: NextApiRequest, res: NextApiResponse, _user: AuthUser) => {
    if (req.method === 'POST') {
      const { empresa, mensagem, contato, status, destaque } = req.body;
      if (!empresa?.trim() || !mensagem?.trim()) {
        return res
          .status(400)
          .json({ error: 'Empresa e mensagem são obrigatórios' });
      }
      const { error } = await supabaseAdmin.from('anuncios').insert({
        empresa: empresa.trim(),
        mensagem: mensagem.trim().slice(0, 120),
        contato: contato?.trim() || null,
        status: status || 'ativo',
        destaque: destaque === true,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('anuncios')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, status, empresa, mensagem, contato, destaque } = req.body;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const update: Record<string, unknown> = {};
      if (status !== undefined) update.status = status;
      if (empresa !== undefined) update.empresa = empresa.trim();
      if (mensagem !== undefined)
        update.mensagem = mensagem.trim().slice(0, 120);
      if (contato !== undefined) update.contato = contato?.trim() || null;
      if (destaque !== undefined) update.destaque = destaque;
      const { error } = await supabaseAdmin
        .from('anuncios')
        .update(update)
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const { error } = await supabaseAdmin
        .from('anuncios')
        .delete()
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  }
);
