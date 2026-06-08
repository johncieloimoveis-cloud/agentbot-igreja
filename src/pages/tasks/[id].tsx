import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getTask, updateTask, deleteTask } from '@/services/tasks';
import { getPeople } from '@/services/people';
import { AlertCircle, Edit2, Trash2, X } from 'lucide-react';

export default function TaskDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    person_id: '',
    priority: 'medium',
    due_date: '',
    status: 'pending',
  });

  useEffect(() => {
    if (!id) return;
    loadTaskData();
    loadPeople();
  }, [id]);

  const loadTaskData = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await getTask(id as string);
      if (err) throw err;

      setTask(data);
      setFormData({
        title: data?.title || '',
        description: data?.description || '',
        person_id: data?.person_id || '',
        priority: data?.priority || 'medium',
        due_date: data?.due_date ? data.due_date.split('T')[0] : '',
        status: data?.status || 'pending',
      });
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getPeople(churchId);
      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Título da tarefa é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await updateTask(id as string, {
        title: formData.title,
        description: formData.description || null,
        person_id: formData.person_id || null,
        responsible_id: user.id,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: formData.status,
      });
      if (err) throw err;

      setIsEditing(false);
      loadTaskData();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao atualizar tarefa');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Deletar esta tarefa?')) return;

    try {
      const { error: err } = await deleteTask(id as string);
      if (err) throw err;
      router.push('/tasks');
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao deletar tarefa');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 dark:bg-slate-800 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
    };
    return labels[status] || status;
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6">
        ← Voltar
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex justify-between items-center">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : isEditing ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Editar Tarefa</h2>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pessoa
                </label>
                <select
                  value={formData.person_id}
                  onChange={(e) => setFormData({ ...formData, person_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Nenhuma</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{task?.title}</h1>
              {task?.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{task.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <Edit2 className="w-5 h-5" />
                Editar
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-5 h-5" />
                Deletar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {task?.person && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Relacionado a</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">{task.person.full_name}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task?.status)}`}>
                  {getStatusLabel(task?.status)}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prioridade</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task?.priority)}`}>
                  {task?.priority === 'high' ? 'Alta' : task?.priority === 'low' ? 'Baixa' : 'Média'}
                </span>
              </div>

              {task?.due_date && (
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vencimento</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {new Date(task.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
