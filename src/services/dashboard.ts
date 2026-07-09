import { supabase } from './supabase';
// Total de pessoas por status
export const getPeopleStats = async (churchId: string) => {
  const { data, error } = await supabase
    .from('people')
    .select('status')
    .eq('church_id', churchId);
  if (error) return { error };
  const stats = {
    total: data?.length || 0,
    active_member: data?.filter((p) => p.status === 'active_member').length || 0,
    visitor: data?.filter((p) => p.status === 'visitor').length || 0,
    new_convert: data?.filter((p) => p.status === 'new_convert').length || 0,
    in_discipleship: data?.filter((p) => p.status === 'in_discipleship').length || 0,
    absent: data?.filter((p) => p.status === 'absent').length || 0,
    transferred: data?.filter((p) => p.status === 'transferred').length || 0,
    leader: data?.filter((p) => p.status === 'leader').length || 0,
  };
  return { data: stats };
};
// Total de grupos
export const getGroupsStats = async (churchId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select('id')
    .eq('church_id', churchId);
  if (error) return { error };
  return { data: { total: data?.length || 0 } };
};
// Total de ministerios
export const getMinistriesStats = async (churchId: string) => {
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .eq('church_id', churchId);
  if (error) return { error };
  return { data: { total: data?.length || 0 } };
};
// Aniversariantes do mes
export const getUpcomingBirthdays = async (churchId: string) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12

  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, date_of_birth, phone, whatsapp')
    .eq('church_id', churchId)
    .not('date_of_birth', 'is', null);
  if (error) return { error };

  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const birthdays = (data || [])
    .map((person: any) => {
      const [, month, day] = person.date_of_birth.split('T')[0].split('-').map(Number);
      return { ...person, birth_month: month, birth_day: day };
    })
    .filter((p: any) => p.birth_month === currentMonth)
    .map((p: any) => {
      const bday = new Date(today.getFullYear(), p.birth_month - 1, p.birth_day);
      const diffDays = Math.round((bday.getTime() - todayNorm.getTime()) / 86400000);
      return { ...p, days_until: diffDays };
    })
    .sort((a: any, b: any) => a.birth_day - b.birth_day);

  return { data: birthdays };
};
// Visitantes recentes
export const getRecentVisitors = async (churchId: string, days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, created_at')
    .eq('church_id', churchId)
    .eq('status', 'visitor')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  if (error) return { error };
  return { data: data || [] };
};
// Pessoas ausentes (status = absent)
export const getAbsentPeople = async (churchId: string, limit: number = 10) => {
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, phone, whatsapp')
    .eq('church_id', churchId)
    .eq('status', 'absent')
    .limit(limit);
  if (error) return { error };
  return { data: data || [] };
};

// Frequencia media
export const getAverageAttendance = async (churchId: string) => {
  const { data, error } = await supabase
    .from('attendance_events')
    .select('id')
    .eq('church_id', churchId);
  if (error) return { error };
  if (!data || data.length === 0) {
    return { data: { total_events: 0, average: 0 } };
  }
  // Contar total de presencas
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('attended', true);
  if (recordsError) return { error: recordsError };
  const average = records && data.length > 0 ? Math.round(records.length / data.length) : 0;
  return {
    data: {
      total_events: data.length,
      total_attendances: records?.length || 0,
      average,
    },
  };
};
