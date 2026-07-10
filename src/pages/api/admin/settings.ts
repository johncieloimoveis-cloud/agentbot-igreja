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
        .from('settings')
        .select('key, value');
      if (error) return res.status(500).json({ error: error.message });
      // Converte array [{key, value}] em objeto { key: value }
      const obj: Record<string, string> = {};
      (data || []).forEach((r: { key: string; value: string }) => { obj[r.key] = r.value; });
      return res.status(200).json(obj);
    }

    if (req.method === 'PATCH') {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'key e value obrigatorios' });
      }
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  }
);
