import { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight } from 'lucide-react';

interface Pergunta {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

type Tela = 'inicio' | 'carregando' | 'jogando' | 'resultado';

const CATEGORIAS = [
  { id: 'geral',       label: '📖 Bíblia Geral',          desc: 'AT e NT' },
  { id: 'at',         label: '📜 Antigo Testamento',       desc: 'Gênesis ao Malaquias' },
  { id: 'nt',         label: '✝️ Novo Testamento',         desc: 'Mateus ao Apocalipse' },
  { id: 'personagens',label: '🧑 Personagens Bíblicos',    desc: 'Quem é quem na Bíblia' },
  { id: 'evangelhos', label: '🕊️ Evangelhos',              desc: 'Vida de Jesus' },
  { id: 'salmos',     label: '🎵 Salmos e Provérbios',     desc: 'Poesia e sabedoria' },
  { id: 'profecias',  label: '🔮 Profecias',               desc: 'Profetas e visões' },
  { id: 'vida_jesus', label: '👑 Ensinamentos de Jesus',   desc: 'Parábolas e milagres' },
];

const DIFICULDADES = [
  { id: 'facil',   label: '😊 Fácil',   desc: 'Para iniciantes' },
  { id: 'medio',   label: '🤔 Médio',   desc: 'Conhecimento intermediário' },
  { id: 'dificil', label: '🧠 Difícil', desc: 'Para estudiosos' },
];

function fraseResultado(acertos: number, total: number) {
  const pct = acertos / total;
  if (pct === 1)   return '🏆 Perfeito! Você domina a Palavra!';
  if (pct >= 0.8)  return '🌟 Excelente! Conhecimento bíblico admirável!';
  if (pct >= 0.6)  return '👍 Bom trabalho! Continue estudando a Bíblia!';
  if (pct >= 0.4)  return '📖 Continue lendo a Bíblia — você vai crescer!';
  return '🙏 Que tal começar um plano de leitura bíblica?';
}

export default function QuizBiblicoPage() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [categoria, setCategoria] = useState('geral');
  const [dificuldade, setDificuldade] = useState('medio');
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [erro, setErro] = useState('');

  const iniciar = async () => {
    setTela('carregando');
    setErro('');
    try {
      const res = await fetch('/api/ai/quiz-biblico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, dificuldade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar quiz');
      setPerguntas(data.perguntas || []);
      setRespostas(new Array(data.perguntas.length).fill(null));
      setAtual(0);
      setRespondida(false);
      setTela('jogando');
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar perguntas');
      setTela('inicio');
    }
  };

  const responder = (opcaoIdx: number) => {
    if (respondida) return;
    setRespondida(true);
    const novas = [...respostas];
    novas[atual] = opcaoIdx;
    setRespostas(novas);
  };

  const proxima = () => {
    if (atual + 1 >= perguntas.length) {
      setTela('resultado');
    } else {
      setAtual(atual + 1);
      setRespondida(false);
    }
  };

  const reiniciar = () => {
    setTela('inicio');
    setPerguntas([]);
    setRespostas([]);
    setAtual(0);
    setRespondida(false);
  };

  // ── Tela inicial ──────────────────────────────────────────
  if (tela === 'inicio') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Bíblico</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">10 perguntas geradas por IA • Teste seu conhecimento</p>
          </div>
        </div>

        {/* Categoria */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wide">Categoria</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  categoria === c.id
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500'
                    : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dificuldade */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wide">Dificuldade</h2>
          <div className="grid grid-cols-3 gap-2">
            {DIFICULDADES.map(d => (
              <button
                key={d.id}
                onClick={() => setDificuldade(d.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  dificuldade === d.id
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500'
                    : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{d.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}

        <button
          onClick={iniciar}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-base transition-colors shadow-sm"
        >
          <Sparkles className="w-5 h-5" />
          Iniciar Quiz
        </button>
      </div>
    );
  }

  // ── Carregando ────────────────────────────────────────────
  if (tela === 'carregando') {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Preparando suas perguntas...</p>
        <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Jogando ───────────────────────────────────────────────
  if (tela === 'jogando' && perguntas.length > 0) {
    const p = perguntas[atual];
    const resposta = respostas[atual];

    return (
      <div className="max-w-xl mx-auto space-y-5">
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Pergunta {atual + 1} de {perguntas.length}</span>
            <span>{respostas.filter(r => r !== null).length} respondidas</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${((atual + (respondida ? 1 : 0)) / perguntas.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">{p.pergunta}</p>
        </div>

        {/* Opções */}
        <div className="space-y-3">
          {p.opcoes.map((opcao, i) => {
            let estilo = 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200';
            let icon = null;

            if (respondida) {
              if (i === p.correta) {
                estilo = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
              } else if (i === resposta && i !== p.correta) {
                estilo = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200';
                icon = <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
              } else {
                estilo = 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-gray-500';
              }
            }

            return (
              <button
                key={i}
                onClick={() => responder(i)}
                disabled={respondida}
                className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-medium text-sm ${estilo} ${!respondida ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opcao}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Explicação */}
        {respondida && (
          <div className={`rounded-xl p-4 text-sm ${
            respostas[atual] === p.correta
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            <p className="font-semibold mb-1">
              {respostas[atual] === p.correta ? '✅ Correto!' : '❌ Incorreto'}
            </p>
            <p className="leading-relaxed">{p.explicacao}</p>
          </div>
        )}

        {respondida && (
          <button
            onClick={proxima}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
          >
            {atual + 1 >= perguntas.length ? (
              <><Trophy className="w-5 h-5" />Ver resultado</>
            ) : (
              <>Próxima <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        )}
      </div>
    );
  }

  // ── Resultado ─────────────────────────────────────────────
  if (tela === 'resultado') {
    const acertos = respostas.filter((r, i) => r === perguntas[i]?.correta).length;
    const total   = perguntas.length;
    const pct     = Math.round((acertos / total) * 100);
    const corRing = pct >= 80 ? 'ring-emerald-400' : pct >= 50 ? 'ring-amber-400' : 'ring-red-400';
    const corTexto = pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

    return (
      <div className="max-w-xl mx-auto space-y-5">
        {/* Score */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className={`w-28 h-28 rounded-full ring-4 ${corRing} bg-gray-50 dark:bg-slate-700 flex flex-col items-center justify-center`}>
            <span className={`text-4xl font-extrabold ${corTexto}`}>{acertos}</span>
            <span className="text-sm text-gray-400">de {total}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pct}% de acertos</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{fraseResultado(acertos, total)}</p>
          </div>
        </div>

        {/* Revisão rápida */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Revisão das respostas</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {perguntas.map((p, i) => {
              const acertou = respostas[i] === p.correta;
              return (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  {acertou
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{p.pergunta}</p>
                    {!acertou && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Correto: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{p.opcoes[p.correta]}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={reiniciar}
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Novo quiz
          </button>
          <button
            onClick={iniciar}
            className="flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Repetir tema
          </button>
        </div>
      </div>
    );
  }

  return null;
}
