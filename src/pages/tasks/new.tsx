import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createTask } from '@/services/tasks';
import { getPeople } from '@/services/people';
import { AlertCircle } from 'lucide-react';

export default function NewTask() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    person_id: '',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    if (user) {
      loadPeople();
    }
  }, [user]);

  const loadPeople = async () => {
    setLoadingPeople(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getPeople(churchId);
      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingPeople(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Título da tarefa é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { error: err } = await createTask(churchId, {
        title: formData.title,
        description: formData.description || null,
        person_id: formData.person_id || null,
        responsible_id: user.id,
        priority: formData.priority,
        due_date: formData.due_date || null,
      });

      if (err) throw err;

      router.push('/tasks');
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao criar tarefa. Tente novamente.');
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
        <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6">
          ← Voltar
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Nova Tarefa</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Crie uma nova tarefa de acompanhamento</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Contatar visitante, Fazer visita pastoral..."
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Detalhes da tarefa..."
            />
          </div>

          {/* Pessoa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relacionado a Pessoa
            </label>
            <select
              value={formData.person_id}
              onChange={(e) => setFormData({ ...formData, person_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loadingPeople}
            >
              <option value="">Nenhuma pessoa</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridade
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          {/* Data de Vencimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
