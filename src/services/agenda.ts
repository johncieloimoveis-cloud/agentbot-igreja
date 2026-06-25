import { supabase } from './supabase';

export type Recurrence = 'weekly' | 'monthly_weekday' | 'monthly_date' | 'once';

export interface RecurringEvent {
  id: string;
  church_id: string;
  title: string;
  event_type: string;
  recurrence: Recurrence;
  day_of_week?: number;       // 0=Dom ... 6=Sáb (weekly + monthly_weekday)
  week_of_month?: number;     // 1-4 (monthly_weekday: ex: 1º domingo)
  day_of_month?: number;      // 1-31 (monthly_date: ex: todo dia 15)
  event_date?: string;        // YYYY-MM-DD (once)
  start_time?: string;
  end_time?: string;
  location?: string;
  group_id?: string;
  leader_id?: string;
  people_ids?: string[];
  notes?: string;
  is_active: boolean;
  _from_group?: boolean;      // true = gerado automaticamente do grupo
  // joins
  group?: { id: string; name: string };
  leader?: { id: string; full_name: string };
}

export interface EventInstance {
  date: Date;
  recurring_event: RecurringEvent;
  attendance_event_id?: string; // se já existe registro de frequência
}

// ---------- CRUD ----------

export const getRecurringEvents = async (churchId: string) => {
  return supabase
    .from('recurring_events')
    .select('*, group:groups(id, name), leader:people(id, full_name)')
    .eq('church_id', churchId)
    .eq('is_active', true)
    .order('created_at');
};

export const getRecurringEvent = async (id: string) => {
  return supabase
    .from('recurring_events')
    .select('*, group:groups(id, name), leader:people(id, full_name)')
    .eq('id', id)
    .single();
};

export const createRecurringEvent = async (churchId: string, data: Partial<RecurringEvent>) => {
  return supabase
    .from('recurring_events')
    .insert({ ...data, church_id: churchId })
    .select()
    .single();
};

export const updateRecurringEvent = async (id: string, data: Partial<RecurringEvent>) => {
  return supabase
    .from('recurring_events')
    .update(data)
    .eq('id', id)
    .select()
    .single();
};

export const deleteRecurringEvent = async (id: string) => {
  return supabase
    .from('recurring_events')
    .update({ is_active: false })
    .eq('id', id);
};

// ---------- Grupos → RecurringEvent ----------

const GROUP_DAY_MAP: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3,
  quinta: 4, sexta: 5, sabado: 6,
};

export const groupToRecurringEvent = (group: any): RecurringEvent => ({
  id: `group_${group.id}`,
  church_id: group.church_id || '',
  title: group.name,
  event_type: 'gceu',
  recurrence: 'weekly',
  day_of_week: GROUP_DAY_MAP[group.meeting_day] ?? 0,
  start_time: group.meeting_time || undefined,
  end_time: undefined,
  location: group.meeting_address || undefined,
  group_id: group.id,
  group: { id: group.id, name: group.name },
  is_active: true,
  _from_group: true,
});

// ---------- Geração de instâncias ----------

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEK_LABELS = ['', '1º', '2º', '3º', '4º'];

export const getRecurrenceLabel = (ev: RecurringEvent): string => {
  switch (ev.recurrence) {
    case 'weekly':
      return `Toda ${DAY_NAMES[ev.day_of_week ?? 0]}`;
    case 'monthly_weekday':
      return `${WEEK_LABELS[ev.week_of_month ?? 1]} ${DAY_NAMES[ev.day_of_week ?? 0]} do mês`;
    case 'monthly_date':
      return `Todo dia ${ev.day_of_month}`;
    case 'once':
      return ev.event_date
        ? new Date(ev.event_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Data única';
    default:
      return '';
  }
};

// Gera todas as instâncias de um evento dentro de um intervalo de datas
export const generateInstances = (event: RecurringEvent, start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(23, 59, 59, 999);

  if (event.recurrence === 'once') {
    if (!event.event_date) return [];
    const d = new Date(event.event_date + 'T12:00:00');
    if (d >= cursor && d <= endDay) dates.push(d);
    return dates;
  }

  if (event.recurrence === 'weekly') {
    const targetDay = event.day_of_week ?? 0;
    // avança até o primeiro dia correto
    while (cursor.getDay() !== targetDay) cursor.setDate(cursor.getDate() + 1);
    while (cursor <= endDay) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return dates;
  }

  if (event.recurrence === 'monthly_weekday') {
    const targetDay = event.day_of_week ?? 0;
    const targetWeek = event.week_of_month ?? 1;
    let m = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (m <= endDay) {
      // encontra o Nº targetDay do mês m
      const first = new Date(m.getFullYear(), m.getMonth(), 1);
      let count = 0;
      let d = new Date(first);
      while (d.getMonth() === m.getMonth()) {
        if (d.getDay() === targetDay) {
          count++;
          if (count === targetWeek) {
            if (d >= cursor && d <= endDay) dates.push(new Date(d));
            break;
          }
        }
        d.setDate(d.getDate() + 1);
      }
      m.setMonth(m.getMonth() + 1);
    }
    return dates;
  }

  if (event.recurrence === 'monthly_date') {
    const targetDate = event.day_of_month ?? 1;
    let m = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (m <= endDay) {
      const d = new Date(m.getFullYear(), m.getMonth(), targetDate);
      if (d.getMonth() === m.getMonth() && d >= cursor && d <= endDay) {
        dates.push(new Date(d));
      }
      m.setMonth(m.getMonth() + 1);
    }
    return dates;
  }

  return dates;
};

// Gera todas as instâncias de todos os eventos para um mês
export const generateMonthInstances = (
  events: RecurringEvent[],
  year: number,
  month: number // 0-indexed
): EventInstance[] => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const instances: EventInstance[] = [];
  for (const ev of events) {
    const dates = generateInstances(ev, start, end);
    for (const date of dates) {
      instances.push({ date, recurring_event: ev });
    }
  }
  instances.sort((a, b) => a.date.getTime() - b.date.getTime());
  return instances;
};
