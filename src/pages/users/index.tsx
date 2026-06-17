import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, deleteUser, isArcanjo } from '@/services/users';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role_id: string;
  roles?: any;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export default function UsersManagement() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadUsers();
      checkRole();
    }
  }, [user]);

  const checkRole = async () => {
    const isArc = await isArcanjo(user?.id || '');
    setUserRole(isArc ? 'Arcanjo' : 'Querubim');
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error: err } = await getUsers(churchId);
      if (err) throw err;
      setUsers((data as User[]) || []);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDelete = async (userId: string, roleName: string) => {
    if (roleName === 'Arcanjo') {
      setError('Não é possível deletar um Arcanjo');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const { error: err } = await deleteUser(userId);
      if (err) throw err;
      loadUsers();
    } catch (err) {
      setError('Erro ao deletar usuário');
    }
  };

  const getRoleColor = (roleName: string) => {
    const colors: { [key: string]: string } = {
      Arcanjo: 'bg-purple-100 text-purple-800',
      Querubim: 'bg-blue-100 text-blue-800',
      Serafim: 'bg-pink-100 text-pink-800',
      Anjinho: 'bg-green-100 text-green-800',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Gestão de Usuários</h1>
        <button
          onClick={() => router.push('/users/invite')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Convidar Usuário
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {usersLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando usuários...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-950 dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 text-gray-950 dark:text-white font-medium">{u.full_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(u.roles?.name || '')}`}>
                        {u.roles?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {u.is_active ? '✓ Ativo' : '✗ Inativo'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.roles?.name !== 'Arcanjo' && (
                          <button
                            onClick={() => handleDelete(u.id, u.roles?.name || '')}
                            className="text-red-600 hover:text-red-700 font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
