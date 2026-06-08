import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getAttendanceEvents } from '@/services/attendance';
import { Plus, Calendar, Users } from 'lucide-react';

interface AttendanceEvent {
  id: string;
  event_type: string;
  event_date: string;
  description?: string;
}

export default function AttendanceList() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user, eventType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getAttendanceEvents(
        churchId,
        eventType || undefined
      );
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      culto: '⛪ Culto',
      estudo_biblico: '📖 Estudo Bíblico',
      reuniao_ministerio: '🙏 Reunião de Ministério',
      evento_especial: '🎉 Evento Especial',
      gceu: '👥 Grupo',
      outro: '📋 Outro',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Frequência</h1>
        <button
          onClick={() => router.push('/attendance/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Evento
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <button
            onClick={() => router.push('/attendance/new')}
            className="mt-4 text-primary-600 hover:underline font-medium"
          >
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
                    <span className="text-2xl">
                      {getEventTypeLabel(event.event_type).split(' ')[0]}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                      {getEventTypeLabel(event.event_type).slice(2)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/attendance/${event.id}`);
                  }}
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
