import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Usa service role para ignorar RLS na tabela roles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEFAULT_ROLES = [
  {
    id: 'a6a04902-be4c-4e07-afcc-531ea893772e',
    name: 'Arcanjo',
    description: 'Owner com poder total'
  },
  {
    id: '2a79ee87-5cf5-4e4d-91fa-8ca1e074d6cd',
    name: 'Querubim',
    description: 'Admin com poder total'
  },
  {
    id: '3b80ff98-6d06-5f5e-a20b-9db185e7f8de',
    name: 'Serafim',
    description: 'Líder de grupo'
  },
  {
    id: '4c910a09-7e07-6f6f-b3bc-aec296f809ef',
    name: 'Anjinho',
    description: 'Membro comum'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(200).json({ data: DEFAULT_ROLES });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    return res.status(200).json({ data: DEFAULT_ROLES });
  }
}
