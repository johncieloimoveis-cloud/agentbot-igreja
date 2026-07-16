import { useState } from 'react';
import { useRouter } from 'next/router';
import { PublicLayout } from '@/components/PublicLayout';
import { Music, Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Church, BookOpen, User } from 'lucide-react';

interface Dimensao {
  nome: string;
  nota: number;
  justificativa: string;
  trecho: string | null;
}

interface Analise {
  titulo_detectado: string | null;
  nota_geral: number;
  nivel: 'Baixa' | 'Media' | 'Alta';
  recomendacao: 'Culto publico' | 'Devocional particular' | 'Ambos';
  resumo: string;
  dimensoes: Dimensao[];
  pontos_positivos: string[];
  pontos_atencao: string[];
}

function NotaBar({ nota }: { nota: number }) {
  const pct = (nota / 10) * 100;
  const cor = nota >= 7 ? 'bg-emerald-500' : nota >= 4 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-8 text-right">{nota.toFixed(1)}</span>
    </div>
  );
}

function NivelBadge({ nivel }: { nivel: string }) {
  const cfg: Record<string, string> = {
    'Alta':  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Media': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Baixa': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${cfg[nivel] || ''}`}>
      {nivel} teocentricidade
    </span>
  );
}

function RecomendacaoBadge({ rec }: { rec: string }) {
  const isPublic = rec === 'Culto publico' || rec === 'Ambos';
  const isPrivate = rec === 'Devocional particular' || rec === 'Ambos';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isPublic && (
        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          <Church className="w-3 h-3" /> Culto público
        </span>
      )}
      {isPrivate && (
        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
          <User className="w-3 h-3" /> Devocional particular
        </span>
      )}
    </div>
  );
}

export default function PublicAnaliseletraPage() {
  const { query } = useRouter();
  const slug = query.slug as string;

  const [titulo, setTitulo] = useState('');
  const [letra, setLetra] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [erro, setErro] = useState('');
  const [expandidas, setExpandidas] = useState<Record<number, boolean>>({});

  const analisar = async () => {
    if (!letra.trim()) { setErro('Cole a letra da música antes de analisar.'); return; }
    setAnalisando(true); setErro(''); setAnalise(null);
    try {
      const res = await fetch('/api/ai/analyze-letra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letra, titulo: titulo.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar');
      setAnalise(data);
      setExpandidas({});
    } catch (err: any) {
      setErro(err.message || 'Erro ao analisar a letra');
    } finally {
      setAnalisando(false);
    }
  };

  const toggleDim = (i: number) => setExpandidas(prev => ({ ...prev, [i]: !prev[i] }));
  const notaGeral = analise?.nota_geral ?? 0;
  const notaCor = notaGeral >= 7 ? 'text-emerald-600 dark:text-emerald-400' : notaGeral >= 4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const notaRing = notaGeral >= 7 ? 'ring-emerald-400' : notaGeral >= 4 ? 'ring-amber-400' : 'ring-red-400';

  return (
    <PublicLayout slug={slug}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Music className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análise Teocêntrica</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avalia o grau de centralidade em Deus na letra da música</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título / Artista <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input type="text" placeholder="Ex: Oceans — Hillsong United" value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Letra da música <span className="text-red-500">*</span>
            </label>
            <textarea placeholder="Cole aqui a letra completa da música..." value={letra}
              onChange={e => setLetra(e.target.value)} rows={10}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-y font-mono" />
            {letra && <p className="text-xs text-gray-400 mt-1 text-right">{letra.length} caracteres</p>}
          </div>
          {erro && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{erro}</p>
            </div>
          )}
          <button onClick={analisar} disabled={analisando || !letra.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
            {analisando
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analisando...</>
              : <><Sparkles className="w-4 h-4" />Analisar Letra</>}
          </button>
        </div>

        {analise && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-20 h-20 rounded-full ring-4 ${notaRing} flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700`}>
                  <span className={`text-2xl font-extrabold ${notaCor}`}>{notaGeral.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">/ 10</span>
                </div>
                <div className="flex-1 space-y-2">
                  {analise.titulo_detectado && <p className="text-xs text-gray-400 dark:text-gray-500 italic">"{analise.titulo_detectado}"</p>}
                  <NivelBadge nivel={analise.nivel} />
                  <RecomendacaoBadge rec={analise.recomendacao} />
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">{analise.resumo}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-500" />Análise por dimensão
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {analise.dimensoes.map((d, i) => (
                  <div key={i} className="px-5 py-4">
                    <button onClick={() => toggleDim(i)} className="w-full text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{d.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${d.nota >= 7 ? 'text-emerald-600 dark:text-emerald-400' : d.nota >= 4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{d.nota.toFixed(1)}</span>
                          {expandidas[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      <NotaBar nota={d.nota} />
                    </button>
                    {expandidas[i] && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{d.justificativa}</p>
                        {d.trecho && <blockquote className="border-l-2 border-violet-400 pl-3 text-sm italic text-gray-500 dark:text-gray-400">"{d.trecho}"</blockquote>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analise.pontos_positivos.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4" />Pontos positivos
                  </h3>
                  <ul className="space-y-1.5">
                    {analise.pontos_positivos.map((p, i) => (
                      <li key={i} className="text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analise.pontos_atencao.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-3">
                    <AlertCircle className="w-4 h-4" />Pontos de atenção
                  </h3>
                  <ul className="space-y-1.5">
                    {analise.pontos_atencao.map((p, i) => (
                      <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button onClick={() => { setAnalise(null); setLetra(''); setTitulo(''); setErro(''); }}
              className="w-full py-2.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
              Analisar outra música
            </button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
