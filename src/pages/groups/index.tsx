import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getGroups } from '@/services/groups';
import { Users, Plus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  leader?: { full_name: string };
  meeting_day?: string;
  meeting_time?: string;
}

export default function Groups() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadGroups();
  }, [user]);

  useEffect(() => {
    // Recarrega quando volta para a página
    if (router.isReady && router.pathname === '/groups') {
      loadGroups();
    }
  }, [router.asPath]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20'; // Church ID real
      console.log('Carregando grupos para churchId:', churchId);
      const { data, error } = await getGroups(churchId);
      console.log('Dados retornados:', data);
      console.log('Erro:', error);
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white mb-6"
      >
        ← Voltar
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grupos</h1>
        <button
          onClick={() => router.push('/groups/new')}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded"
        >
          <Plus className="w-5 h-5" />
          Novo Grupo
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhum grupo cadastrado</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => router.push(`/groups/${group.id}`)}
              className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow cursor-pointer hover:shadow-md"
            >
              <h3 className="font-bold text-lg">{group.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Líder: {group.leader?.full_name || 'Sem líder'}
              </p>
              {group.meeting_day && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.meeting_day} às {group.meeting_time}
                </p>
              )}
              <div className="flex items-center gap-2 text-primary-600 mt-2">
                <Users className="w-4 h-4" />
                <span>Ver detalhes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
