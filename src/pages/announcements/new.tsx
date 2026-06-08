import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createAnnouncement } from '@/services/announcements';
import { AlertCircle } from 'lucide-react';

export default function NewAnnouncement() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'normal' | 'urgent',
    expires_at: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { error: err } = await createAnnouncement({
        church_id: churchId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        created_by: user!.id,
        expires_at: formData.expires_at || undefined,
      });

      if (err) throw err;
      router.push('/announcements');
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao criar aviso');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4"
        >
          ← Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Novo Aviso</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Título do aviso"
            maxLength={255}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.title.length}/255 caracteres
          </p>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Detalhe o aviso aqui..."
            rows={6}
          />
        </div>

        {/* Prioridade */}
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
            <option value="urgent">Urgente 🔴</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Avisos urgentes aparecem em destaque
          </p>
        </div>

        {/* Data de Expiração */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data de Expiração (opcional)
          </label>
          <input
            type="datetime-local"
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            O aviso será automaticamente arquivado após esta data
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? 'Publicando...' : 'Publicar Aviso'}
          </button>
        </div>
      </form>
    </div>
  );
}
