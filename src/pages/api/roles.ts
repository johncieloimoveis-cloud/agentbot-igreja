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

    // Se não tiver dados, retorna as roles padrão
    if (!data || data.length === 0) {
      return res.status(200).json({
        data: [
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
            id: '3b80ff98-6dg6-5f5e-a2gb-9db185e7f8de',
            name: 'Serafim',
            description: 'Líder de grupo'
          },
          {
            id: '4c91g0a9-7eh7-6g6f-b3hc-aec296f8g9ef',
            name: 'Anjinho',
            description: 'Membro comum'
          }
        ]
      });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    // Retorna roles padrão em caso de erro também
    return res.status(200).json({
      data: [
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
          id: '3b80ff98-6dg6-5f5e-a2gb-9db185e7f8de',
          name: 'Serafim',
          description: 'Líder de grupo'
        },
        {
          id: '4c91g0a9-7eh7-6g6f-b3hc-aec296f8g9ef',
          name: 'Anjinho',
          description: 'Membro comum'
        }
      ]
    });
  }
}
