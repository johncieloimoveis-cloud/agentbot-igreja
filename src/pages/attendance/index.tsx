import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getAttendanceEvents } from '@/services/attendance';
import { Plus, Calendar, Sparkles, AlertTriangle, ChevronUp, ChevronDown, X } from 'lucide-react';
import { WhatsAppShare } from '@/components/WhatsAppShare';

interface AttendanceEvent {
  id: string;
  event_type: string;
  event_date: string;
}

interface AbsentPerson {
  id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
}

export default function AttendanceList() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('');

  const [absentPeople, setAbsentPeople] = useState<AbsentPerson[]>([]);
  const [absentLoading, setAbsentLoading] = useState(false);
  const [absentChecked, setAbsentChecked] = useState(false);
  const [showAbsent, setShowAbsent] = useState(true);
  const [weeksThreshold, setWeeksThreshold] = useState(2);

  // aiMessages: personId → mensagem gerada
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const handleCopy = (id: string, msg: string) => {
    navigator.clipboard.writeText(msg);
    setCopied((p) => ({ ...p, [id]: true }));
    setTimeout(() => setCopied((p) => ({ ...p, [id]: false })), 2000);
  };

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user, eventType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getAttendanceEvents(churchId, eventType || undefined);
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectAbsences = async () => {
    setAbsentLoading(true);
    setAbsentChecked(false);
    setAiMessages({});
    try {
      const res = await fetch(`/api/attendance/detect-absences?weeks=${weeksThreshold}`);
      const data = await res.json();
      setAbsentPeople(data.data || []);
      setAbsentChecked(true);
      setShowAbsent(true);
    } catch (err) {
      console.error('Erro ao detectar ausentes:', err);
    } finally {
      setAbsentLoading(false);
    }
  };

  const handleGenerateMessage = async (person: AbsentPerson) => {
    setAiLoading((prev) => ({ ...prev, [person.id]: true }));
    try {
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'resgate',
          personName: person.full_name.split(' ')[0],
          weeksAbsent: weeksThreshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiMessages((prev) => ({ ...prev, [person.id]: data.message }));
    } catch (err) {
      console.error('Erro IA:', err);
    } finally {
      setAiLoading((prev) => ({ ...prev, [person.id]: false }));
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      culto: '⛪ Culto', estudo_biblico: '📖 Estudo Bíblico',
      reuniao_ministerio: '🙏 Reunião de Ministério', evento_especial: '🎉 Evento Especial',
      gceu: '👥 Grupo', outro: '📋 Outro',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    });

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white mb-6">
        ← Voltar
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Frequência</h1>
        <button
          onClick={() => router.push('/attendance/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Evento
        </button>
      </div>

      {/* Painel de Ausentes */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">Detectar Ausentes</h2>
            {absentChecked && absentPeople.length > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                {absentPeople.length} pessoa{absentPeople.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Ausentes há mais de</span>
              <select
                value={weeksThreshold}
                onChange={(e) => setWeeksThreshold(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded text-sm"
              >
                <option value={1}>1 semana</option>
                <option value={2}>2 semanas</option>
                <option value={3}>3 semanas</option>
                <option value={4}>4 semanas</option>
              </select>
            </div>
            <button
              onClick={handleDetectAbsences}
              disabled={absentLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {absentLoading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verificando...</>
              ) : 'Verificar'}
            </button>
            {absentChecked && absentPeople.length > 0 && (
              <button onClick={() => setShowAbsent((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showAbsent ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {absentChecked && showAbsent && (
          <div className="p-4">
            {absentPeople.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                ✅ Nenhum ausente detectado no período
              </p>
            ) : (
              <div className="space-y-3">
                {absentPeople.map((person) => (
                  <div key={person.id} className={`rounded-lg overflow-hidden ${aiMessages[person.id] ? 'border border-violet-200 dark:border-violet-800' : ''}`}>
                    <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{person.full_name}</p>
                        {person.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{person.phone}</p>}
                      </div>
                      {!aiMessages[person.id] ? (
                        <button
                          onClick={() => handleGenerateMessage(person)}
                          disabled={aiLoading[person.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          {aiLoading[person.id] ? (
                            <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Gerando...</>
                          ) : (
                            <><Sparkles className="w-3 h-3" />Mensagem IA</>
                          )}
                        </button>
                      ) : null}
                    </div>
                    {aiMessages[person.id] && (
                      <div className="bg-violet-50 dark:bg-violet-900/20 p-3 border-t border-violet-100 dark:border-violet-800">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{aiMessages[person.id]}</p>
                        <div className="flex gap-2 flex-wrap">
                          <WhatsAppShare
                            phone={person.whatsapp || person.phone || ''}
                            message={aiMessages[person.id]}
                            onCopy={() => setCopied((p) => ({ ...p, [person.id]: true }))}
                          />
                          <button
                            onClick={() => handleGenerateMessage(person)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            Regerar
                          </button>
                          <button
                            onClick={() => setAiMessages((prev) => { const n = { ...prev }; delete n[person.id]; return n; })}
                            className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os eventos</option>
          <option value="culto">⛪ Culto</option>
          <option value="estudo_biblico">📖 Estudo Bíblico</option>
          <option value="reuniao_ministerio">🙏 Reunião de Ministério</option>
          <option value="evento_especial">🎉 Evento Especial</option>
          <option value="gceu">👥 Grupo</option>
          <option value="outro">📋 Outro</option>
        </select>
      </div>

      {/* Lista de Eventos */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4">Carregando eventos...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum evento cadastrado</p>
          <button onClick={() => router.push('/attendance/new')} className="mt-4 text-primary-600 hover:underline font-medium">
            Crie o primeiro evento
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/attendance/${event.id}`)}
              className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getEventTypeLabel(event.event_type).split(' ')[0]}</span>
                    <h3 className="text-xl font-bold text-gray-950 dark:text-white">
                      {(event as any).name || getEventTypeLabel(event.event_type).slice(2)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.event_date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/attendance/${event.id}`); }}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Registrar Presença
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
