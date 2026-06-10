import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getTasks, completeTask, deleteTask } from '@/services/tasks';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Plus, CheckCircle, Circle, Trash2, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  person?: { id: string; full_name: string; phone?: string };
  status: string;
  priority: string;
  due_date?: string;
}

export default function TasksList() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user, status]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getTasks(churchId, status || undefined);
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Deletar esta tarefa?')) return;
    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Erro:', error);
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

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    };
    return labels[priority] || priority;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6">
        ← Voltar
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Tarefas</h1>
        <button
          onClick={() => router.push('/tasks/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as tarefas</option>
          <option value="pending">Pendentes</option>
          <option value="in_progress">Em Andamento</option>
          <option value="completed">Concluídas</option>
        </select>
      </div>

      {/* Lista de Tarefas */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4">Carregando tarefas...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma tarefa encontrada</p>
          <button
            onClick={() => router.push('/tasks/new')}
            className="mt-4 text-primary-600 hover:underline font-medium"
          >
            Crie a primeira tarefa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow ${
                isOverdue(task.due_date || '') ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className={`mt-1 flex-shrink-0 ${
                      task.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-bold text-gray-900 dark:text-slate-100 ${task.status === 'completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {task.person && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          👤 {task.person.full_name}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.due_date && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            isOverdue(task.due_date)
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-800'
                          }`}
                        >
                          📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Ver
                  </button>
                  {task.person?.phone && (
                    <WhatsAppButton
                      phone={task.person.phone}
                      name={task.person.full_name}
                      messageType="taskreminder"
                      extraData={task.title}
                      variant="icon"
                      size="md"
                    />
                  )}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
