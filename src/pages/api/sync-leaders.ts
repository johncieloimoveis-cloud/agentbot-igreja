import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserForLeader } from '@/services/userSync';
import { supabase } from '@/services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

    const { data: allGroups, error } = await supabase
      .from('groups')
      .select('leader_id, id, parent_group_id')
      .eq('church_id', churchId);

    if (error) throw error;

    // Filtrar apenas grupos com líder
    const leaders = allGroups?.filter(g => g.leader_id) || [];

    if (!leaders || leaders.length === 0) {
      return res.status(200).json({ message: 'Nenhum lider encontrado', results: [] });
    }

    const uniqueLeaders = Array.from(new Map(leaders.map(l => [l.leader_id, l])).values());
    const results: any[] = [];

    for (const leader of uniqueLeaders) {
      try {
        const result = await createUserForLeader(leader.leader_id, leader.id, churchId);
        results.push({
          leader_id: leader.leader_id,
          success: !result.error,
          message: result.message || 'OK',
          error: result.error ? result.error.message : null
        });
      } catch (err) {
        results.push({
          leader_id: leader.leader_id,
          success: false,
          error: err instanceof Error ? err.message : 'Erro'
        });
      }
    }

    const created = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(200).json({ 
      message: 'Sincronizacao concluida',
      created,
      failed,
      total: uniqueLeaders.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
}
