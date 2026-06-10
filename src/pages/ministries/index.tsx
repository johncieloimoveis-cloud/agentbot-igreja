import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getMinistries } from '@/services/ministries';
import { Plus, Users } from 'lucide-react';

interface Ministry {
  id: string;
  name: string;
  description?: string;
}

export default function MinistriesList() {
  const router = useRouter();
  const { user } = useAuth();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadMinistries();
  }, [user]);

  const loadMinistries = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getMinistries(churchId);
      if (error) throw error;
      setMinistries(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Ministérios</h1>
        <button
          onClick={() => router.push('/ministries/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Ministério
        </button>
      </div>

      {/* Lista de Ministérios */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4">Carregando ministérios...</p>
        </div>
      ) : ministries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum ministério cadastrado</p>
          <button
            onClick={() => router.push('/ministries/new')}
            className="mt-4 text-primary-600 hover:underline font-medium"
          >
            Crie o primeiro ministério
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <div
              key={ministry.id}
              onClick={() => router.push(`/ministries/${ministry.id}`)}
              className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{ministry.name}</h3>
                  {ministry.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{ministry.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary-600 mt-4">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Ver membros</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
