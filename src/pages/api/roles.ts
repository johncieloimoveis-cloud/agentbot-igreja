import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/services/supabase';
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
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    return res.status(500).json({ error: 'Erro ao buscar roles' });
  }
}
