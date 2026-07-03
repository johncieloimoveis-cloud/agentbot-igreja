import { useState, useEffect } from 'react';
import { PlusCircle, Flame, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Devocional {
  id: string;
  titulo: string;
  conteudo: string;
  escritura: string;
  data: string;
  created_at: string;
}

export default function Devocionais() {
  const { user } = useAuth();
  const [lista, setLista] = useState<Devocional[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: '', escritura: '', conteudo: '', data: new Date().toISOString().split('T')[0] });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('devotionals')
      .select('*')
      .order('data', { ascending: false });
    setLista(data || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!form.titulo.trim()) { setErro('Informe um título.'); return; }
    if (!form.conteudo.trim()) { setErro('Informe o conteúdo.'); return; }
    setSalvando(true);
    setErro('');
    const { error } = await supabase.from('devotionals').insert({
      titulo: form.titulo.trim(),
      escritura: form.escritura.trim() || null,
      conteudo: form.conteudo.trim(),
      data: form.data,
      created_by: user?.id,
    });
    if (error) {
      setErro(error.message);
    } else {
      setForm({ titulo: '', escritura: '', conteudo: '', data: new Date().toISOString().split('T')[0] });
      setCriando(false);
      carregar();
    }
    setSalvando(false);
  };

  const hoje = new Date().toISOString().split('T')[0];
  const devocionalHoje = lista.find(d => d.data === hoje);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devocionais</h1>
        </div>
        <button
          onClick={() => { setCriando(true); setErro(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Devocional
        </button>
      </div>

      {/* Formulário */}
      {criando && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-orange-200 dark:border-orange-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Novo Devocional</h2>
            <button onClick={() => setCriando(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Título *"
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <input
              type="text"
              placeholder="Escritura (ex: Sl 23:1)"
              value={form.escritura}
              onChange={e => setForm(p => ({ ...p, escritura: e.target.value }))}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="date"
              value={form.data}
              onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <textarea
            placeholder="Conteúdo do devocional... *"
            value={form.conteudo}
            onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
            rows={7}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />

          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Publicar'}
          </button>
        </div>
      )}

      {/* Devocional de hoje */}
      {devocionalHoje && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Devocional de Hoje</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{devocionalHoje.titulo}</h2>
          {devocionalHoje.escritura && (
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3">📖 {devocionalHoje.escritura}</p>
          )}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{devocionalHoje.conteudo}</p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : lista.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum devocional publicado ainda.</p>
          <p className="text-sm mt-1">Publique o primeiro devocional!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(d => (
            <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setExpandido(expandido === d.id ? null : d.id)}
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{d.titulo}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {d.escritura && <span className="text-xs text-primary-600 dark:text-primary-400">📖 {d.escritura}</span>}
                    <span className="text-xs text-gray-400">
                      {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {expandido === d.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
              </button>
              {expandido === d.id && (
                <div className="px-5 pb-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-100 dark:border-slate-700 pt-4">
                  {d.conteudo}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
