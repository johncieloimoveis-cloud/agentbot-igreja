import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createAttendanceEvent } from '@/services/attendance';
import { AlertCircle } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';
export default function NewAttendanceEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    event_type: 'culto',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '19:00',
    description: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Nome do evento é obrigatório');
      return;
    }
    if (!formData.event_type) {
      setError('Tipo de evento é obrigatório');
      return;
    }
    if (!formData.event_date) {
      setError('Data do evento é obrigatória');
      return;
    }
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const eventDateTime = formData.event_time
        ? `${formData.event_date}T${formData.event_time}:00`
        : `${formData.event_date}T00:00:00`;
      console.log('Enviando evento:', {
        event_type: formData.event_type,
        event_date: eventDateTime,
        description: formData.description || null,
      });
      const { data, error: err } = await createAttendanceEvent(churchId, {
        name: formData.name,
        event_type: formData.event_type,
        event_date: eventDateTime,
      });
      console.log('Resposta:', { data, err });
      if (err) {
        console.error('Erro do Supabase:', err);
        throw err;
      }
      router.push('/attendance');
    } catch (err) {
      console.error('Erro completo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Tente novamente.';
      setError(`Erro ao criar evento: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  if (!user) {
    return <div className="p-6">Carregando...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white mb-6"
        >
          ← Voltar
        </button>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Novo Evento de Presença</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Crie um novo evento para registrar presenças</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          {/* Nome do Evento */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Evento *
              <HelpTooltip text="Nome descritivo para identificar este registro. Ex: Culto de Domingo 22/06, Estudo de João cap. 3." />
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Culto de Domingo, Estudo Bíblico..."
            />
          </div>
          {/* Tipo de Evento */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Evento *
              <HelpTooltip text="Categoria do evento. Usada para filtrar relatórios e comparar frequência entre cultos, GCEUs e outros encontros." />
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="culto">⛪ Culto</option>
              <option value="estudo_biblico">📖 Estudo Bíblico</option>
              <option value="reuniao_ministerio">🙏 Reunião de Ministério</option>
              <option value="evento_especial">🎉 Evento Especial</option>
              <option value="gceu">👥 Grupo</option>
              <option value="outro">📋 Outro</option>
            </select>
          </div>
          {/* Data */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data do Evento *
              <HelpTooltip text="Data em que o evento ocorreu ou ocorrerá. Dica: eventos criados pela Agenda já preenchem a data automaticamente." />
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {/* Hora */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horário
              <HelpTooltip text="Horário de início do evento. Opcional, mas útil para diferenciar dois eventos no mesmo dia." />
            </label>
            <input
              type="time"
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Evento'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
