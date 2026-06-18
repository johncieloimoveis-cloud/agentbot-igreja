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
