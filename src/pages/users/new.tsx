import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createUser } from '@/services/users';
import { AlertCircle } from 'lucide-react';

export default function NewUser() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'secretary' as 'admin' | 'pastor' | 'secretary' | 'group_leader' | 'ministry_leader',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!formData.full_name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { error: err } = await createUser({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        church_id: churchId,
      });

      if (err) throw err;
      router.push('/users');
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao criar usuário');
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Novo Usuário</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="usuario@exemplo.com"
          />
        </div>

        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Digite o nome completo"
          />
        </div>

        {/* Papel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Papel no Sistema *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="admin">Administrador (Acesso Total)</option>
            <option value="pastor">Pastor (Gerencia Geral)</option>
            <option value="secretary">Secretário (Gerencia Dados)</option>
            <option value="group_leader">Líder de Grupo (Apenas Seu Grupo)</option>
            <option value="ministry_leader">Líder de Ministério (Apenas Seu Ministério)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Escolha o papel de acordo com o nível de permissão necessário
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
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
