import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserForLeader } from '@/services/userSync';
import { supabase } from '@/services/supabase';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

    // Usar service role key para contornar RLS
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZnl3a2VoaXF4cWpucnVjdHl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQwNDI4NSwiZXhwIjoyMDk1OTgwMjg1fQ.o9JjD6j416BHhpebmNzMqPq4aHnCL0j_6z65K_egKsg';

    const supabaseAdmin = createClient(
      'https://hdfywkehiqxqjnructyy.supabase.co',
      serviceRoleKey
    );

    const { data: allGroups, error } = await supabaseAdmin
      .from('groups')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    // DEBUG
    const debug = {
      totalGroups: allGroups?.length || 0,
      churchId,
      sample: allGroups?.[0],
      withLeader: allGroups?.filter(g => g.leader_id)?.length || 0
    };

    // Filtrar: apenas church correto E com líder
    const leaders = (allGroups || []).filter(g =>
      g.church_id === churchId && g.leader_id
    );

    if (!leaders || leaders.length === 0) {
      return res.status(200).json({
        message: 'Nenhum lider encontrado',
        results: [],
        debug
      });
    }

    const uniqueLeaders = Array.from(new Map(leaders.map(l => [l.leader_id, l])).values());
    const results: any[] = [];

    for (const leader of uniqueLeaders) {
      try {
        const result = await createUserForLeader(leader.leader_id, leader.id, churchId);
        const hasError = result.error !== undefined && result.error !== null;
        results.push({
          leader_id: leader.leader_id,
          success: !hasError,
          message: result.message || (hasError ? 'Erro' : 'OK'),
          error: hasError ? (result.error instanceof Error ? result.error.message : String(result.error)) : null
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
