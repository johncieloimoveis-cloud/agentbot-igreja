import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getPeople } from '@/services/people';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Plus, Search, Upload } from 'lucide-react';

interface Person {
  id: string;
  full_name: string;
  phone?: string;
  status: string;
  membresia?: boolean;
  eh_lider?: boolean;
  oficial?: string;
}

export default function PeopleList() {
  const router = useRouter();
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPeople();
  }, [user, search, status]);

  const loadPeople = async () => {
    setLoading(true);
    try {
      // TODO: Obter church_id do user ou context
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20'; // Substitua pelo ID real
      
      const { data, error } = await getPeople(
        churchId,
        status || undefined,
        search || undefined
      );
      
      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      visitor: 'bg-blue-100 text-blue-800',
      eventual: 'bg-orange-100 text-orange-800',
      active_member: 'bg-green-100 text-green-800',
      new_convert: 'bg-yellow-100 text-yellow-800',
      in_discipleship: 'bg-purple-100 text-purple-800',
      absent: 'bg-gray-100 dark:bg-slate-800 text-gray-800',
      transferred: 'bg-red-100 text-red-800',
      leader: 'bg-indigo-100 text-indigo-800',
    };
    return colors[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      visitor: 'Visitante',
      eventual: 'Eventual',
      active_member: 'Membro Ativo',
      new_convert: 'Novo Convertido',
      in_discipleship: 'Em Discipulado',
      absent: 'Afastado',
      transferred: 'Transferido',
      leader: 'Liderança',
    };
    return labels[status] || status;
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white mb-6"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Pessoas</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/people/import')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Importar
          </button>
          <button
            onClick={() => router.push('/people/new')}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Pessoa
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 md:w-48"
        >
          <option value="">Todos os status</option>
          <option value="visitor">Visitante</option>
          <option value="eventual">Eventual</option>
          <option value="active_member">Membro Ativo</option>
          <option value="new_convert">Novo Convertido</option>
          <option value="in_discipleship">Em Discipulado</option>
          <option value="absent">Afastado</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4">Carregando pessoas...</p>
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma pessoa cadastrada</p>
          <button
            onClick={() => router.push('/people/new')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Cadastre uma nova pessoa
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Telefone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Membro</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Líder</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Oficial</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-gray-950 dark:text-white font-medium">{person.full_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{person.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(person.status)}`}>
                        {getStatusLabel(person.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {person.membresia ? '✓ Sim' : '✗ Não'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {person.eh_lider ? '✓ Sim' : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {person.oficial && person.oficial !== 'NÃO' ? person.oficial : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/people/${person.id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                          Ver
                        </button>
                        {person.phone && (
                          <WhatsAppButton
                            phone={person.phone}
                            name={person.full_name}
                            messageType="followup"
                            variant="icon"
                            size="md"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
