import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import {
  getRecurringEvents, generateMonthInstances, generateInstances, getRecurrenceLabel,
  RecurringEvent, EventInstance
} from '@/services/agenda';
import { createAttendanceEvent, getAttendanceEvents } from '@/services/attendance';
import {
  Plus, ChevronLeft, ChevronRight, Calendar, List,
  Clock, MapPin, Users, User, Repeat, Check
} from 'lucide-react';

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

const EVENT_TYPE_COLORS: Record<string, string> = {
  culto: 'bg-blue-500',
  gceu: 'bg-green-500',
  missoes: 'bg-purple-500',
  evangelismo: 'bg-orange-500',
  estudo_biblico: 'bg-teal-500',
  reuniao_ministerio: 'bg-pink-500',
  outro: 'bg-gray-500',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  culto: 'Culto',
  gceu: 'GCEU',
  missoes: 'Missões',
  evangelismo: 'Evangelismo',
  estudo_biblico: 'Estudo Bíblico',
  reuniao_ministerio: 'Reunião de Ministério',
  outro: 'Outro',
};

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];
const DAY_NAMES_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function AgendaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const today = new Date();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<RecurringEvent[]>([]);
  const [instances, setInstances] = useState<EventInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [attendanceEvents, setAttendanceEvents] = useState<any[]>([]);
  const [creatingAttendance, setCreatingAttendance] = useState<string | null>(null);
  const [created, setCreated] = useState<Record<string, string>>({}); // instanceKey → attendanceEventId

  useEffect(() => { if (user) loadEvents(); }, [user]);
  useEffect(() => {
    setInstances(generateMonthInstances(events, currentYear, currentMonth));
    setSelectedDay(null);
  }, [events, currentYear, currentMonth]);

  useEffect(() => {
    loadAttendanceEvents();
  }, [currentYear, currentMonth]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await getRecurringEvents(CHURCH_ID);
      setEvents(data || []);
    } finally { setLoading(false); }
  };

  const loadAttendanceEvents = async () => {
    const { data } = await getAttendanceEvents(CHURCH_ID);
    setAttendanceEvents(data || []);
  };

  const instanceKey = (inst: EventInstance) =>
    `${inst.recurring_event.id}_${inst.date.toISOString().slice(0,10)}`;

  const findAttendanceEvent = (inst: EventInstance) => {
    const dateStr = inst.date.toISOString().slice(0,10);
    return attendanceEvents.find(
      (ae) => ae.event_date?.slice(0,10) === dateStr &&
               ae.event_type === inst.recurring_event.event_type
    );
  };

  const handleOpenAttendance = async (inst: EventInstance) => {
    const existing = findAttendanceEvent(inst);
    if (existing) { router.push(`/attendance/${existing.id}`); return; }

    const key = instanceKey(inst);
    setCreatingAttendance(key);
    try {
      const dateStr = inst.date.toISOString().slice(0,10);
      const { data } = await createAttendanceEvent(CHURCH_ID, {
        event_type: inst.recurring_event.event_type,
        event_date: dateStr,
        title: inst.recurring_event.title,
        location: inst.recurring_event.location || null,
      });
      if (data?.id) router.push(`/attendance/${data.id}`);
    } finally { setCreatingAttendance(null); }
  };

  // --- Calendário ---
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const instancesByDay: Record<number, EventInstance[]> = {};
  for (const inst of instances) {
    const d = inst.date.getDate();
    if (!instancesByDay[d]) instancesByDay[d] = [];
    instancesByDay[d].push(inst);
  }

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
    else setCurrentMonth(m => m + 1);
  };

  // Lista semanal — próximos 28 dias
  const listStart = new Date(today); listStart.setHours(0,0,0,0);
  const listEnd = new Date(listStart); listEnd.setDate(listEnd.getDate() + 27);
  const listInstances: EventInstance[] = [];
  for (const ev of events) {
    const dates = generateInstances(ev, listStart, listEnd);
    for (const date of dates) listInstances.push({ date, recurring_event: ev });
  }
  listInstances.sort((a,b) => a.date.getTime() - b.date.getTime());

  // Agrupar lista por semana
  const weekGroups: { label: string; items: EventInstance[] }[] = [];
  for (const inst of listInstances) {
    const diff = Math.floor((inst.date.getTime() - listStart.getTime()) / (7*24*3600*1000));
    const weekIdx = Math.min(diff, 3);
    const labels = ['Esta semana','Próxima semana','Em 2 semanas','Em 3 semanas'];
    if (!weekGroups[weekIdx]) weekGroups[weekIdx] = { label: labels[weekIdx], items: [] };
    weekGroups[weekIdx].items.push(inst);
  }

  const selectedInstances = selectedDay ? (instancesByDay[selectedDay] || []) : [];
  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Agenda</h1>
        <button
          onClick={() => router.push('/agenda/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />Novo Evento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          <Calendar className="w-4 h-4" />Calendário
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          <List className="w-4 h-4" />Lista
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
          Carregando...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl shadow">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Nenhum evento cadastrado</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Crie o primeiro evento recorrente da sua igreja</p>
          <button onClick={() => router.push('/agenda/new')} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium">
            Criar Evento
          </button>
        </div>
      ) : view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            {/* Nav mês */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Grid dias da semana */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES_SHORT.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-2">{d}</div>
              ))}
            </div>

            {/* Grid dias */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayInsts = instancesByDay[day] || [];
                const isSelected = selectedDay === day;
                const todayClass = isToday(day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative min-h-[60px] p-1 rounded-lg border transition-all text-left
                      ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent hover:border-gray-200 dark:hover:border-slate-600'}
                      ${todayClass ? 'ring-2 ring-primary-500' : ''}
                    `}
                  >
                    <span className={`text-sm font-semibold block mb-1 w-6 h-6 flex items-center justify-center rounded-full
                      ${todayClass ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayInsts.slice(0,3).map((inst, idx) => (
                        <div key={idx} className={`text-[10px] text-white px-1 rounded truncate ${EVENT_TYPE_COLORS[inst.recurring_event.event_type] || 'bg-gray-500'}`}>
                          {inst.recurring_event.title}
                        </div>
                      ))}
                      {dayInsts.length > 3 && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">+{dayInsts.length - 3}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel lateral — eventos do dia / legenda */}
          <div className="space-y-4">
            {selectedDay && selectedInstances.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  {selectedDay} de {MONTH_NAMES[currentMonth]}
                </h3>
                <div className="space-y-3">
                  {selectedInstances.map((inst, idx) => {
                    const ae = findAttendanceEvent(inst);
                    const key = instanceKey(inst);
                    return (
                      <div key={idx} className="border border-gray-100 dark:border-slate-700 rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${EVENT_TYPE_COLORS[inst.recurring_event.event_type] || 'bg-gray-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{inst.recurring_event.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{EVENT_TYPE_LABELS[inst.recurring_event.event_type] || inst.recurring_event.event_type}</p>
                          </div>
                        </div>
                        {inst.recurring_event.start_time && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <Clock className="w-3 h-3" />
                            {inst.recurring_event.start_time.slice(0,5)}
                            {inst.recurring_event.end_time && ` – ${inst.recurring_event.end_time.slice(0,5)}`}
                          </div>
                        )}
                        {inst.recurring_event.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <MapPin className="w-3 h-3" />
                            {inst.recurring_event.location}
                          </div>
                        )}
                        {inst.recurring_event.leader && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <User className="w-3 h-3" />
                            {inst.recurring_event.leader.full_name}
                          </div>
                        )}
                        {inst.recurring_event.group && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <Users className="w-3 h-3" />
                            {inst.recurring_event.group.name}
                          </div>
                        )}
                        <button
                          onClick={() => handleOpenAttendance(inst)}
                          disabled={creatingAttendance === key}
                          className={`w-full text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors
                            ${ae ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                        >
                          {creatingAttendance === key ? (
                            <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Abrindo...</>
                          ) : ae ? (
                            <><Check className="w-3 h-3" />Ver Frequência</>
                          ) : (
                            'Registrar Frequência'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Clique em um dia para ver os eventos</p>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">Tipos de evento</h3>
                <div className="space-y-2">
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${EVENT_TYPE_COLORS[key]}`} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eventos recorrentes cadastrados */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Eventos cadastrados</h3>
                <Repeat className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => router.push(`/agenda/${ev.id}`)}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${EVENT_TYPE_COLORS[ev.event_type] || 'bg-gray-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ev.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getRecurrenceLabel(ev)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW LISTA */
        <div className="space-y-6">
          {weekGroups.filter(Boolean).map((group, gi) => (
            <div key={gi}>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{group.label}</h2>
              <div className="space-y-2">
                {group.items.map((inst, idx) => {
                  const ae = findAttendanceEvent(inst);
                  const key = instanceKey(inst);
                  return (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex items-center gap-4">
                      {/* Data */}
                      <div className="flex-shrink-0 text-center w-14">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{DAY_NAMES_SHORT[inst.date.getDay()]}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{inst.date.getDate()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{MONTH_NAMES[inst.date.getMonth()].slice(0,3)}</p>
                      </div>
                      {/* Cor */}
                      <div className={`w-1 self-stretch rounded-full ${EVENT_TYPE_COLORS[inst.recurring_event.event_type] || 'bg-gray-400'}`} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">{inst.recurring_event.title}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          {inst.recurring_event.start_time && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{inst.recurring_event.start_time.slice(0,5)}
                            </span>
                          )}
                          {inst.recurring_event.location && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{inst.recurring_event.location}
                            </span>
                          )}
                          {inst.recurring_event.leader && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" />{inst.recurring_event.leader.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Botão frequência */}
                      <button
                        onClick={() => handleOpenAttendance(inst)}
                        disabled={creatingAttendance === key}
                        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5
                          ${ae ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                      >
                        {creatingAttendance === key
                          ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : ae ? <><Check className="w-3 h-3" />Frequência</> : 'Registrar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {weekGroups.filter(Boolean).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhum evento nos próximos 28 dias</div>
          )}
        </div>
      )}
    </div>
  );
}
