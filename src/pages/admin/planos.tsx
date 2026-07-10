import { useState, useEffect, useRef } from 'react';
import { Building2, Crown, Gift, RefreshCw, Users, Check, Pencil, Settings2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface Igreja {
  id: string;
  name: string;
  plano: 'gratuito' | 'pagante';
  people_limit: number;
}

export default function AdminPlanos() {
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [editandoLimite, setEditandoLimite] = useState<string | null>(null);
  const [limiteInput, setLimiteInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Default global
  const [defaultLimit, setDefaultLimit] = useState<number>(50);
  const [editandoDefault, setEditandoDefault] = useState(false);
  const [defaultInput, setDefaultInput] = useState('');
  const defaultInputRef = useRef<HTMLInputElement>(null);

  const carregar = async () => {
    setLoading(true);
    const [igrejasRes, settingsRes] = await Promise.all([
      fetchWithAuth('/api/admin/igrejas'),
      fetchWithAuth('/api/admin/settings'),
    ]);
    const igrejasData = await igrejasRes.json();
    const settingsData = await settingsRes.json();
    setIgrejas(Array.isArray(igrejasData) ? igrejasData : []);
    const dl = parseInt(settingsData?.default_people_limit || '50', 10);
    setDefaultLimit(dl);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);
  useEffect(() => { if (editandoLimite) inputRef.current?.focus(); }, [editandoLimite]);
  useEffect(() => { if (editandoDefault) defaultInputRef.current?.focus(); }, [editandoDefault]);

  const alternarPlano = async (igreja: Igreja) => {
    const novoPlano = igreja.plano === 'gratuito' ? 'pagante' : 'gratuito';
    setAtualizando(igreja.id + '_plano');
    const res = await fetchWithAuth('/api/admin/igrejas', {
      method: 'PATCH',
      body: JSON.stringify({ id: igreja.id, plano: novoPlano }),
    });
    if (res.ok) setIgrejas(prev => prev.map(i => i.id === igreja.id ? { ...i, plano: novoPlano } : i));
    setAtualizando(null);
  };

  const iniciarEdicaoLimite = (igreja: Igreja) => {
    setEditandoLimite(igreja.id);
    setLimiteInput(String(igreja.people_limit ?? defaultLimit));
  };

  const salvarLimite = async (id: string) => {
    const limit = parseInt(limiteInput, 10);
    if (isNaN(limit) || limit < 1) return;
    setAtualizando(id + '_limit');
    const res = await fetchWithAuth('/api/admin/igrejas', {
      method: 'PATCH',
      body: JSON.stringify({ id, people_limit: limit }),
    });
    if (res.ok) setIgrejas(prev => prev.map(i => i.id === id ? { ...i, people_limit: limit } : i));
    setEditandoLimite(null);
    setAtualizando(null);
  };

  const salvarDefault = async () => {
    const val = parseInt(defaultInput, 10);
    if (isNaN(val) || val < 1) return;
    const res = await fetchWithAuth('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key: 'default_people_limit', value: val }),
    });
    if (res.ok) setDefaultLimit(val);
    setEditandoDefault(false);
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
              Gerencie plano e limite de pessoas por igreja.
            </p>
          </div>
        </div>
        <button onClick={carregar} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Atualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Config global */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Configuracoes globais</span>
        </div>
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Limite padrao para novas igrejas:</span>
          {editandoDefault ? (
            <div className="flex items-center gap-2">
              <input
                ref={defaultInputRef}
                type="number"
                min={1}
                value={defaultInput}
                onChange={e => setDefaultInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvarDefault(); if (e.key === 'Escape') setEditandoDefault(false); }}
                className="w-24 px-2 py-1 text-sm border border-primary-400 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={salvarDefault} className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg" title="Salvar">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditandoDefault(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{defaultLimit} pessoas</span>
              <button
                onClick={() => { setEditandoDefault(true); setDefaultInput(String(defaultLimit)); }}
                className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-7">
          Aplicado automaticamente quando uma nova igreja se cadastra via /signup.
        </p>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-slate-600 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">Gratuito — banner + limite de pessoas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">Pagante — sem banner, limite livre</span>
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
            <div key={ig.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{ig.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {ig.plano === 'pagante' ? (
                        <><Crown className="w-3 h-3 text-amber-500" /><span className="text-xs font-medium text-amber-600 dark:text-amber-400">Pagante</span></>
                      ) : (
                        <><Gift className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-500 dark:text-gray-400">Gratuito</span></>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => alternarPlano(ig)}
                  disabled={atualizando === ig.id + '_plano'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    ig.plano === 'pagante'
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                  }`}
                >
                  {atualizando === ig.id + '_plano' ? 'Salvando...' : ig.plano === 'pagante' ? 'Rebaixar para Gratuito' : 'Marcar como Pagante'}
                </button>
              </div>

              {/* Limite individual */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Limite de pessoas:</span>
                {editandoLimite === ig.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="number"
                      min={1}
                      value={limiteInput}
                      onChange={e => setLimiteInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') salvarLimite(ig.id); if (e.key === 'Escape') setEditandoLimite(null); }}
                      className="w-24 px-2 py-1 text-sm border border-primary-400 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button onClick={() => salvarLimite(ig.id)} disabled={atualizando === ig.id + '_limit'} className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50" title="Salvar">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditandoLimite(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Cancelar</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {ig.plano === 'pagante' ? 'Ilimitado' : (ig.people_limit ?? defaultLimit)}
                    </span>
                    {ig.plano !== 'pagante' && (
                      <button onClick={() => iniciarEdicaoLimite(ig)} className="p-1 text-gray-400 hover:text-primary-500 transition-colors" title="Editar limite">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
