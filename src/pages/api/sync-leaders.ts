import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserForLeader } from '@/services/userSync';
import { supabase } from '@/services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

    const { data: leaders, error } = await supabase
      .from('groups')
      .select('leader_id, id, parent_group_id')
      .eq('church_id', churchId)
      .not('leader_id', 'is', null);

    if (error) throw error;

    const uniqueLeaders = Array.from(new Map(leaders.map(l => [l.leader_id, l])).values());

    let created = 0;
    let failed = 0;

    for (const leader of uniqueLeaders) {
      const result = await createUserForLeader(leader.leader_id, leader.id, churchId);
      if (result.error) {
        failed++;
      } else {
        created++;
      }
    }

    res.status(200).json({ 
      message: 'Sincronização concluída',
      created,
      failed,
      total: uniqueLeaders.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
}
