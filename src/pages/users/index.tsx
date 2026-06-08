import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, deleteUser, getRoleLabel, getRoleBadgeColor } from '@/services/users';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

export default function UsersList() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error: err } = await getUsers(churchId);
      if (err) throw err;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const { error: err } = await deleteUser(userId);
      if (err) throw err;
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao deletar usuário');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <button
        onClick={() => router.push('/dashboard')}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            👥 Usuários do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os usuários e suas permissões
          </p>
        </div>
        <button
          onClick={() => router.push('/users/new')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Lista de Usuários */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Carregando usuários...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum usuário cadastrado</p>
          <button
            onClick={() => router.push('/users/new')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Criar primeiro usuário
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Nome / Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{user.full_name || '-'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/users/${user.id}`)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
