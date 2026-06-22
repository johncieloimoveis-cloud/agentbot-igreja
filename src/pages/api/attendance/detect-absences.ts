import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
  const weeksThreshold = Number(req.query.weeks || 2);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeksThreshold * 7);

  try {
    // 1. Buscar todos os eventos da igreja, ordenados por data
    const { data: events, error: eventsError } = await supabase
      .from('attendance_events')
      .select('id, event_date')
      .eq('church_id', churchId)
      .order('event_date', { ascending: false });

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) return res.status(200).json({ data: [] });

    const recentEventIds = events
      .filter((e) => new Date(e.event_date) >= cutoffDate)
      .map((e) => e.id);

    const olderEventIds = events
      .filter((e) => new Date(e.event_date) < cutoffDate)
      .map((e) => e.id);

    if (olderEventIds.length === 0) return res.status(200).json({ data: [] });

    // 2. Pessoas que já compareceram antes do período recente
    const { data: historicRecords, error: historicError } = await supabase
      .from('attendance_records')
      .select('person_id, person:people(id, full_name, phone, whatsapp)')
      .in('event_id', olderEventIds)
      .eq('attended', true);

    if (historicError) throw historicError;
    if (!historicRecords || historicRecords.length === 0) return res.status(200).json({ data: [] });

    // Mapa de pessoas únicas que já compareceram antes
    const historicMap = new Map<string, any>();
    for (const r of historicRecords) {
      if (r.person_id && r.person && !historicMap.has(r.person_id)) {
        historicMap.set(r.person_id, r.person);
      }
    }

    // 3. Pessoas que compareceram em eventos recentes
    const recentAttendees = new Set<string>();
    if (recentEventIds.length > 0) {
      const { data: recentRecords } = await supabase
        .from('attendance_records')
        .select('person_id')
        .in('event_id', recentEventIds)
        .eq('attended', true);

      (recentRecords || []).forEach((r) => recentAttendees.add(r.person_id));
    }

    // 4. Ausentes = estiveram antes mas não nos últimos N eventos
    const absent = Array.from(historicMap.entries())
      .filter(([personId]) => !recentAttendees.has(personId))
      .map(([, person]) => person)
      .slice(0, 15);

    return res.status(200).json({ data: absent, cutoffDate: cutoffDate.toISOString(), weeksThreshold });
  } catch (error: any) {
    console.error('Erro detect-absences:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}
