import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId é obrigatório' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.error('Erro ao deletar tarefa:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
