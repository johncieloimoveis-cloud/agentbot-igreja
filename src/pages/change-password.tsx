import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/services/supabase';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      // Atualiza a senha
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw pwErr;

      // Limpa a flag de primeiro acesso
      await supabase.auth.updateUser({
        data: { must_change_password: false },
      });

      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-7 h-7 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar nova senha</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
              Este é seu primeiro acesso. Defina uma senha pessoal para continuar.
            </p>
          </div>

          {done ? (
            <div className="flex flex-col items-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-green-700 dark:text-green-400 font-semibold">Senha atualizada!</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar senha
                </label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Salvando...' : 'Definir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
