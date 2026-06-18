import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getUser, updateUser, isArcanjo } from '@/services/users';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role_id: string;
  roles?: any;
  is_active: boolean;
  created_at: string;
}

export default function EditUser() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { id } = router.query;

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    if (id && authUser) {
      loadUser();
      loadRoles();
    }
  }, [id, authUser]);

  const loadUser = async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    try {
      const { data, error: err } = await getUser(id);
      if (err) throw err;
      setUser(data as User);
      setFormData({
        full_name: (data as User).full_name || '',
        email: (data as User).email || '',
        role_id: (data as User).role_id || '',
        is_active: (data as User).is_active !== false,
      });
    } catch (err) {
      setError('Erro ao carregar usuário');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const json = await response.json();
      if (json.data) {
        setRoles(json.data);
      }
    } catch (err) {
      console.error('Erro ao carregar roles:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== 'string' || !user) return;

    // Validação
    if (!formData.full_name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }
    if (!formData.role_id) {
      setError('Role é obrigatória');
      return;
    }

    // Verificar se está tentando alterar role de Arcanjo
    const isCurrentArcanjo = user.roles?.name === 'Arcanjo' || (Array.isArray(user.roles) && user.roles[0]?.name === 'Arcanjo');
    const isNewRoleArcanjo = roles.find(r => r.id === formData.role_id)?.name === 'Arcanjo';

    if (isCurrentArcanjo && !isNewRoleArcanjo) {
      setError('Não é possível alterar a role de um Arcanjo');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: err } = await updateUser(id, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role_id: formData.role_id,
        is_active: formData.is_active,
      });

      if (err) throw err;
      setSuccess('Usuário atualizado com sucesso!');
      setTimeout(() => {
        router.push('/users');
      }, 1500);
    } catch (err) {
      setError('Erro ao salvar usuário');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!authUser || !user) {
    return null;
  }

  const currentRoleName = user.roles?.name || (Array.isArray(user.roles) && user.roles[0]?.name) || 'N/A';
  const isCurrentArcanjo = currentRoleName === 'Arcanjo';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Botão voltar */}
      <button
        onClick={() => router.push('/users')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Editar Usuário</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">ID: {user.id}</p>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <p className="text-green-800 dark:text-green-300 text-sm">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Digite o nome completo"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="usuario@email.com"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role *
            {isCurrentArcanjo && <span className="text-red-600 dark:text-red-400 text-xs ml-2">(Arcanjo - não pode ser alterado)</span>}
          </label>
          <select
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            disabled={isCurrentArcanjo}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecione uma role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {isCurrentArcanjo && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              A role de Arcanjo não pode ser alterada por questões de segurança.
            </p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Usuário Ativo
          </label>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Data de criação:</strong> {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
            <strong>Role atual:</strong> {currentRoleName}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Mudanças'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/users')}
            className="flex-1 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
