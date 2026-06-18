import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserForLeader } from '@/services/userSync';
import { supabase } from '@/services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

    // Debug: buscar todos os grupos
    const { data: allGroups, error: allGroupsError } = await supabase
      .from('groups')
      .select('id, name, leader_id, parent_group_id')
      .eq('church_id', churchId);

    console.log('Todos os grupos:', allGroups?.length || 0);
    console.log('Grupos com líder:', allGroups?.filter(g => g.leader_id)?.length || 0);

    // Buscar líderes
    const { data: leaders, error } = await supabase
      .from('groups')
      .select('leader_id, id, parent_group_id')
      .eq('church_id', churchId)
      .not('leader_id', 'is', null);

    console.log('Query result:', leaders?.length || 0);
    
    if (error) throw error;

    if (!leaders || leaders.length === 0) {
      return res.status(200).json({ 
        message: 'Nenhum líder encontrado',
        created: 0,
        failed: 0,
        total: 0,
        debug: { totalGroups: allGroups?.length || 0 }
      });
    }

    const uniqueLeaders = Array.from(new Map(leaders.map(l => [l.leader_id, l])).values());

    let created = 0;
    let failed = 0;

    for (const leader of uniqueLeaders) {
      try {
        const result = await createUserForLeader(leader.leader_id, leader.id, churchId);
        if (result.error) {
          failed++;
          console.error(`Erro para ${leader.leader_id}:`, result.error);
        } else {
          created++;
        }
      } catch (err) {
        failed++;
        console.error(`Erro:`, err);
      }
    }

    res.status(200).json({ 
      message: 'Sincronização concluída',
      created,
      failed,
      total: uniqueLeaders.length
    });
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: 'Erro ao sincronizar', details: error instanceof Error ? error.message : 'Unknown' });
  }
}
