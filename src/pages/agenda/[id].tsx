import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getRecurringEvent, deleteRecurringEvent, getRecurrenceLabel, RecurringEvent } from '@/services/agenda';
import { Calendar, Trash2, ArrowLeft, Clock, MapPin, Users, Repeat } from 'lucide-react';

const EVENT_TYPE_LABELS: Record<string, string> = {
  culto: 'Culto',
  gceu: 'GCEU / Grupo',
  missoes: 'Missoes',
  evangelismo: 'Evangelismo',
  estudo_biblico: 'Estudo Biblico',
  reuniao_ministerio: 'Reuniao de Ministerio',
  outro: 'Outro',
};

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terca', 3: 'Quarta',
  4: 'Quinta', 5: 'Sexta', 6: 'Sabado',
};

export default function AgendaEventPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [event, setEvent] = useState<RecurringEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    getRecurringEvent(id as string).then(({ data, error: err }) => {
      if (err || !data) { setError('Evento nao encontrado.'); }
      else { setEvent(data); }
      setLoading(false);
    });
  }, [id, user]);

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm(`Deletar "${event.title}"? Esta acao nao pode ser desfeita.`)) return;
    setDeleting(true);
    const { error: err } = await deleteRecurringEvent(event.id);
    if (err) { setError('Erro ao deletar evento.'); setDeleting(false); return; }
    router.push('/agenda');
  };

  if (!user) return null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  if (error || !event) return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <p className="text-red-500 mb-4">{error || 'Evento nao encontrado.'}</p>
      <button onClick={() => router.push('/agenda')} className="text-primary-600 hover:underline">
        Voltar para Agenda
      </button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <button onClick={() => router.push('/agenda')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar para Agenda
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deletando...' : 'Deletar'}
          </button>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Repeat className="w-4 h-4 flex-shrink-0" />
            <span>{getRecurrenceLabel(event)}</span>
          </div>

          {event.start_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {event.start_time.slice(0, 5)}
                {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {event.group && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Grupo: {event.group.name}</span>
            </div>
          )}

          {event.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
              {event.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
