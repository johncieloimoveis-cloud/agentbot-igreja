import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getAnnouncements } from '@/services/announcements';
import { Plus, AlertCircle, Trash2, Edit2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: 'normal' | 'urgent';
  created_at: string;
  creator?: { full_name: string };
}

export default function AnnouncementsList() {
  const router = useRouter();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAnnouncements();
  }, [user]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getAnnouncements(churchId);
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
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

  const getPriorityStyles = (priority: string) => {
    return priority === 'urgent'
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-4 border-red-500'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500';
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <button
        onClick={() => router.push('/dashboard')}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            📢 Mural de Avisos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mantenha todos informados sobre notícias importantes
          </p>
        </div>
        <button
          onClick={() => router.push('/announcements/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Aviso
        </button>
      </div>

      {/* Avisos */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Carregando avisos...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum aviso no mural</p>
          <button
            onClick={() => router.push('/announcements/new')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Criar primeiro aviso
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-6 rounded-lg shadow-sm ${getPriorityStyles(announcement.priority)}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{announcement.title}</h2>
                    {announcement.priority === 'urgent' && (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-500 dark:bg-red-600 text-white rounded">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-75 mb-3">
                    Por {announcement.creator?.full_name} • {formatDate(announcement.created_at)}
                  </p>
                  <p className="line-clamp-3">{announcement.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/announcements/${announcement.id}`)}
                    className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Deletar este aviso?')) {
                        // Implementar delete
                      }
                    }}
                    className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-red-600 dark:text-red-400"
                    title="Deletar"
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
