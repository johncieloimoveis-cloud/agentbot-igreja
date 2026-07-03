import { useState, useEffect } from 'react';
import { Building2, Crown, Gift, RefreshCw } from 'lucide-react';

interface Igreja {
  id: string;
  name: string;
  plano: 'gratuito' | 'pagante';
}

export default function AdminPlanos() {
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/igrejas');
    const data = await res.json();
    setIgrejas(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const alternarPlano = async (igreja: Igreja) => {
    const novoPlano = igreja.plano === 'gratuito' ? 'pagante' : 'gratuito';
    setAtualizando(igreja.id);
    const res = await fetch('/api/admin/igrejas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: igreja.id, plano: novoPlano }),
    });
    if (res.ok) {
      setIgrejas(prev => prev.map(i => i.id === igreja.id ? { ...i, plano: novoPlano } : i));
    }
    setAtualizando(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-7 h-7 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Igrejas pagantes não exibem o banner de anúncios.
            </p>
          </div>
        </div>
        <button
          onClick={carregar}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-slate-600 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">
            Gratuito — exibe ticker + banner de anúncios
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">
            Pagante — exibe apenas ticker
          </span>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : igrejas.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma igreja encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {igrejas.map(ig => (
            <div
              key={ig.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{ig.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ig.plano === 'pagante' ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Pagante — sem banner
                        </span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Gratuito — exibe banner
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => alternarPlano(ig)}
                disabled={atualizando === ig.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  ig.plano === 'pagante'
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                }`}
              >
                {atualizando === ig.id
                  ? 'Salvando...'
                  : ig.plano === 'pagante'
                  ? 'Rebaixar para Gratuito'
                  : '⭐ Marcar como Pagante'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
