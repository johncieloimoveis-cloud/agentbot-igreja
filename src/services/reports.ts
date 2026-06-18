import { supabase } from './supabase';
// Relatório de pessoas por status
export const getPersonByStatusReport = async (churchId: string) => {
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, status, email, phone, created_at')
    .eq('church_id', churchId)
    .order('status');
  if (error) return { error };
  // Agrupar por status
  const grouped: { [key: string]: any[] } = {};
  (data || []).forEach((person) => {
    if (!grouped[person.status]) {
      grouped[person.status] = [];
    }
    grouped[person.status].push(person);
  });
  return { data: grouped };
};
// Relatório de visitantes
export const getVisitorsReport = async (churchId: string, startDate?: string, endDate?: string) => {
  let query = supabase
    .from('people')
    .select('id, full_name, email, phone, whatsapp, created_at')
    .eq('church_id', churchId)
    .eq('status', 'visitor');
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return { error };
  return { data: data || [] };
};
// Relatório de frequência
export const getFrequencyReport = async (churchId: string) => {
  const { data: events, error: eventsError } = await supabase
    .from('attendance_events')
    .select('id, name, event_date, event_type')
    .eq('church_id', churchId)
    .order('event_date', { ascending: false });
  if (eventsError) return { error: eventsError };
  // Para cada evento, contar presenças
  const report = [];
  for (const event of events || []) {
    const { data: records, error: recordsError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('event_id', event.id)
      .eq('attended', true);
    if (!recordsError) {
      report.push({
        ...event,
        total_attended: records?.length || 0,
      });
    }
  }
  return { data: report };
};
// Relatório de ministérios
export const getMinistriesReport = async (churchId: string) => {
  const { data: ministries, error: ministriesError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('church_id', churchId)
    .order('name');
  if (ministriesError) return { error: ministriesError };
  // Para cada ministério, contar membros
  const report = [];
  for (const ministry of ministries || []) {
    const { data: members, error: membersError } = await supabase
      .from('department_members')
      .select('id')
      .eq('department_id', ministry.id);
    if (!membersError) {
      report.push({
        ...ministry,
        total_members: members?.length || 0,
      });
    }
  }
  return { data: report };
};
// Relatório de grupos
export const getGroupsReport = async (churchId: string) => {
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name, meeting_day, meeting_time, meeting_address')
    .eq('church_id', churchId)
    .order('name');
  if (groupsError) return { error: groupsError };
  // Para cada grupo, contar membros
  const report = [];
  for (const group of groups || []) {
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id);
    if (!membersError) {
      report.push({
        ...group,
        total_members: members?.length || 0,
      });
    }
  }
  return { data: report };
};
// Exportar para CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escapar aspas e envolver em aspas se necessário
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        })
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
