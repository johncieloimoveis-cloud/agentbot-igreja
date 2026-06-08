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

// Total de ministérios
export const getMinistriesStats = async (churchId: string) => {
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .eq('church_id', churchId);

  if (error) return { error };

  return { data: { total: data?.length || 0 } };
};

// Aniversariantes do mês
export const getUpcomingBirthdays = async (churchId: string, days: number = 7) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, date_of_birth')
    .eq('church_id', churchId)
    .not('date_of_birth', 'is', null)
    .order('date_of_birth');

  if (error) return { error };

  // Filtrar aniversariantes nos próximos N dias
  const birthdays = (data || []).filter((person: any) => {
    if (!person.date_of_birth) return false;

    const birthDate = new Date(person.date_of_birth);
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );

    // Se já passou este ano, próximo será no próximo ano
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
    }

    return thisYearBirthday >= today && thisYearBirthday <= futureDate;
  });

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

// Frequência média
export const getAverageAttendance = async (churchId: string) => {
  const { data, error } = await supabase
    .from('attendance_events')
    .select('id')
    .eq('church_id', churchId);

  if (error) return { error };

  if (!data || data.length === 0) {
    return { data: { total_events: 0, average: 0 } };
  }

  // Contar total de presenças
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
