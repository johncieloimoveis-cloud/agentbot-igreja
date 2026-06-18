import { useState } from 'react';
import { Zap } from 'lucide-react';

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/sync-leaders', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Sincronizar Líderes
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Clique no botão abaixo para criar automaticamente usuários para todos os líderes de grupos.
        </p>

        <button
          onClick={handleSync}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mb-4"
        >
          {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg mb-4">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-green-800 dark:text-green-300 font-semibold mb-2">✓ {result.message}</p>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <li>✓ Criados: {result.created}</li>
                <li>✗ Erros: {result.failed}</li>
                <li>📊 Total: {result.total}</li>
              </ul>
            </div>

            {result.results && result.results.length > 0 && (
              <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Detalhes:</h3>
                <div className="space-y-2 text-sm">
                  {result.results.map((r: any, i: number) => (
                    <div key={i} className={`p-2 rounded ${r.success ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                      <p>{r.success ? '✓' : '✗'} {r.leader_id}</p>
                      <p className="text-xs opacity-75">{r.message || r.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
