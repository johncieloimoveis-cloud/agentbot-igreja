import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createMinistry } from '@/services/ministries';
import { AlertCircle } from 'lucide-react';

export default function NewMinistry() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome do ministério é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { error: err } = await createMinistry(churchId, {
        name: formData.name,
        description: formData.description || null,
      });

      if (err) throw err;

      router.push('/ministries');
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao criar ministério. Tente novamente.');
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
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6"
        >
          ← Voltar
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Novo Ministério</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Crie um novo ministério para a igreja</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Ministério *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Louvor, Infantil, Ação Social..."
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descreva o propósito e objetivos do ministério..."
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Ministério'}
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
