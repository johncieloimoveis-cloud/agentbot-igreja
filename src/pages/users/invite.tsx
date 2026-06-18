import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Send, AlertCircle } from 'lucide-react';

export default function InviteUser() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { supabase } = await import('@/services/supabase');
      const { data, error: err } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (err) throw err;
      setRoles(data || []);
    } catch (err) {
      console.error('Erro ao carregar roles:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !fullName || !roleId) {
      setError('Preencha todos os campos');
      return;
    }

    setSending(true);
    try {
      // Por enquanto, apenas mostramos mensagem de sucesso
      // Em produção, você chamaria uma API para enviar o convite via email
      setSuccess(`Convite será enviado para ${email} com role ${roles.find(r => r.id === roleId)?.name}`);
      setEmail('');
      setFullName('');
      setRoleId('');
      
      setTimeout(() => router.push('/users'), 2000);
    } catch (err) {
      setError('Erro ao enviar convite');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white mb-6">Convidar Usuário</h1>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome da pessoa"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione um role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors mt-6"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Enviando...' : 'Enviar Convite'}
          </button>
        </form>

        <button
          onClick={() => router.back()}
          className="w-full mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 font-medium py-2 border border-gray-300 dark:border-slate-700 rounded-lg transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
