import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/services/announcements';
import { AlertCircle, Trash2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: 'normal' | 'urgent';
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  creator?: { full_name: string };
}

export default function AnnouncementDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'normal' | 'urgent',
    expires_at: '',
  });

  useEffect(() => {
    if (!id) return;
    loadAnnouncement();
  }, [id]);

  const loadAnnouncement = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await getAnnouncement(id as string);
      if (err) throw err;
      setAnnouncement(data);
      setFormData({
        title: data.title,
        description: data.description,
        priority: data.priority,
        expires_at: data.expires_at || '',
      });
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar aviso');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Título e descrição são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await updateAnnouncement(id as string, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        expires_at: formData.expires_at || undefined,
      });

      if (err) throw err;
      setEditing(false);
      loadAnnouncement();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao atualizar aviso');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este aviso?')) return;

    setLoading(true);
    try {
      const { error: err } = await deleteAnnouncement(id as string);
      if (err) throw err;
      router.push('/announcements');
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao deletar aviso');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAuthor = user?.id === announcement?.created_by;

  if (!user) return null;
  if (loading && !announcement) return <div className="text-center py-12">Carregando...</div>;
  if (!announcement)
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Aviso não encontrado</p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/announcements')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4"
        >
          ← Voltar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {editing ? (
        /* Modo Edição */
        <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'normal' | 'urgent' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiração
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {loading ? 'Atualizando...' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : (
        /* Modo Visualização */
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {announcement.title}
                </h1>
                {announcement.priority === 'urgent' && (
                  <span className="px-2 py-1 text-xs font-semibold bg-red-500 dark:bg-red-600 text-white rounded">
                    URGENTE
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Por {announcement.creator?.full_name} • {formatDate(announcement.created_at)}
              </p>
              {announcement.expires_at && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  ⏰ Expira em {formatDate(announcement.expires_at)}
                </p>
              )}
            </div>

            {isAuthor && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {announcement.description}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
            <p>Atualizado em {formatDate(announcement.updated_at)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
