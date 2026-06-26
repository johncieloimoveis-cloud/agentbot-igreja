import { supabase } from './supabase';
// Listar eventos de presença
export const getAttendanceEvents = async (churchId: string, eventType?: string) => {
  let query = supabase
    .from('attendance_events')
    .select('*')
    .eq('church_id', churchId)
    .order('event_date', { ascending: false });
  if (eventType) query = query.eq('event_type', eventType);
  return query;
};
// Buscar um evento específico
export const getAttendanceEvent = async (eventId: string) => {
  return supabase
    .from('attendance_events')
    .select('*')
    .eq('id', eventId)
    .single();
};
// Criar novo evento de presença
export const createAttendanceEvent = async (churchId: string, data: any) => {
  return supabase
    .from('attendance_events')
    .insert({
      ...data,
      church_id: churchId,
    })
    .select()
    .single();
};
// Atualizar evento
export const updateAttendanceEvent = async (eventId: string, data: any) => {
  return supabase
    .from('attendance_events')
    .update(data)
    .eq('id', eventId)
    .select()
    .single();
};
// Deletar evento
export const deleteAttendanceEvent = async (eventId: string) => {
  return supabase
    .from('attendance_events')
    .delete()
    .eq('id', eventId);
};
// Listar presenças de um evento
export const getEventAttendances = async (eventId: string) => {
  return supabase
    .from('attendance_records')
    .select('*, person:people(id, full_name, phone)')
    .eq('event_id', eventId)
    .order('recorded_at');
};
// Registrar presença
export const recordAttendance = async (eventId: string, personId: string, attended: boolean = true) => {
  return supabase
    .from('attendance_records')
    .insert({
      event_id: eventId,
      person_id: personId,
      attended,
    })
    .select()
    .single();
};
// Remover registro de presença
export const removeAttendance = async (attendanceRecordId: string) => {
  return supabase
    .from('attendance_records')
    .delete()
    .eq('id', attendanceRecordId);
};
// Obter estatísticas de frequência de uma pessoa
export const getPersonAttendanceStats = async (personId: string, churchId: string) => {
  return supabase
    .from('attendance_records')
    .select('*, attendance_event:attendance_events(event_type, event_date)')
    .eq('person_id', personId)
    .eq('attendance_event.church_id', churchId)
    .order('recorded_at', { ascending: false });
};
// ---------- Estatísticas de frequência por grupo ----------

export type Quadrant = 'presente' | 'sumindo' | 'voltando' | 'irregular' | 'sem_historico';

export interface MemberAttendanceStat {
  person_id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  total_events: number;    // total de reuniões na janela analisada
  attended_total: number;  // total de presenças
  attended_recent: number; // presenças na janela recente (últimas N)
  attended_older: number;  // presenças na janela anterior
  recent_window: number;   // tamanho da janela recente
  older_window: number;    // tamanho da janela anterior
  velocidade: number;      // 0–1: taxa geral de presença
  aceleracao: number;      // -1–1: diferença entre taxa recente e anterior
  quadrant: Quadrant;
}

/**
 * Calcula velocidade e aceleração de frequência para cada membro do grupo.
 * - totalWindow: quantas reuniões passadas analisar (padrão 8)
 * - recentWindow: quantas das últimas considerar como "recentes" (padrão 3)
 */
export const getGroupAttendanceStats = async (
  groupId: string,
  totalWindow = 8,
  recentWindow = 3,
): Promise<{ data?: MemberAttendanceStat[]; error?: any }> => {
  // 1. Últimas N reuniões do grupo (ordenadas da mais recente para mais antiga)
  const { data: events, error: evError } = await supabase
    .from('attendance_events')
    .select('id, event_date')
    .eq('group_id', groupId)
    .order('event_date', { ascending: false })
    .limit(totalWindow);

  if (evError) return { error: evError };
  if (!events || events.length === 0) return { data: [] };

  const eventIds = events.map((e: any) => e.id);
  const recentIds = new Set(events.slice(0, recentWindow).map((e: any) => e.id));
  const olderIds  = new Set(events.slice(recentWindow).map((e: any) => e.id));
  const olderWindow = events.length - Math.min(recentWindow, events.length);

  // 2. Registros de presença para esses eventos
  const { data: records, error: recError } = await supabase
    .from('attendance_records')
    .select('event_id, person_id, attended')
    .in('event_id', eventIds)
    .eq('attended', true);

  if (recError) return { error: recError };

  // 3. Membros do grupo
  const { data: members, error: memError } = await supabase
    .from('group_memberships')
    .select('person_id, person:people(id, full_name, phone, whatsapp)')
    .eq('group_id', groupId);

  if (memError) return { error: memError };

  // 4. Mapa de presenças por pessoa
  const attMap: Record<string, { recent: number; older: number }> = {};
  for (const rec of (records || [])) {
    if (!attMap[rec.person_id]) attMap[rec.person_id] = { recent: 0, older: 0 };
    if (recentIds.has(rec.event_id))      attMap[rec.person_id].recent++;
    else if (olderIds.has(rec.event_id))  attMap[rec.person_id].older++;
  }

  // 5. Calcular métricas por membro
  const totalCount = events.length;
  const hasEnoughForTrend = totalCount >= recentWindow + 2;

  const stats: MemberAttendanceStat[] = (members || []).map((m: any) => {
    const att = attMap[m.person_id] || { recent: 0, older: 0 };
    const attendedTotal = att.recent + att.older;
    const velocidade = totalCount > 0 ? attendedTotal / totalCount : 0;
    const recentRate = recentWindow > 0 ? att.recent / Math.min(recentWindow, totalCount) : 0;
    const olderRate  = olderWindow > 0  ? att.older  / olderWindow : 0;
    const aceleracao = hasEnoughForTrend ? recentRate - olderRate : 0;

    // Quadrante
    let quadrant: Quadrant;
    if (totalCount < 3) {
      quadrant = 'sem_historico';
    } else if (velocidade >= 0.5 && aceleracao <= -0.25) {
      quadrant = 'sumindo';
    } else if (velocidade < 0.5 && aceleracao >= 0.2) {
      quadrant = 'voltando';
    } else if (recentRate >= 0.6) {
      quadrant = 'presente';
    } else {
      quadrant = 'irregular';
    }

    return {
      person_id: m.person_id,
      full_name: m.person.full_name,
      phone: m.person.phone,
      whatsapp: m.person.whatsapp,
      total_events: totalCount,
      attended_total: attendedTotal,
      attended_recent: att.recent,
      attended_older: att.older,
      recent_window: Math.min(recentWindow, totalCount),
      older_window: olderWindow,
      velocidade,
      aceleracao,
      quadrant,
    };
  });

  // Ordenar: sumindo → irregular → voltando → presente → sem_historico
  const ORDER: Record<Quadrant, number> = {
    sumindo: 0, irregular: 1, voltando: 2, presente: 3, sem_historico: 4,
  };
  stats.sort((a, b) => ORDER[a.quadrant] - ORDER[b.quadrant] || b.velocidade - a.velocidade);

  return { data: stats };
};

// Marcar múltiplas presenças de uma vez
export const recordMultipleAttendances = async (eventId: string, personIds: string[]) => {
  const records = personIds.map((personId) => ({
    event_id: eventId,
    person_id: personId,
    attended: true,
  }));
  return supabase
    .from('attendance_records')
    .insert(records)
    .select();
};
