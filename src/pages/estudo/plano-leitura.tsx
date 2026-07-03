import { useState, useEffect } from 'react';
import { CheckCircle, Circle, CalendarDays } from 'lucide-react';
import Link from 'next/link';

// Plano "Bíblia em 1 Ano" — 365 dias de leitura
// Cada entrada: [livro_api, capítulos]
const PLANO: { dia: number; leituras: { livroId: string; nome: string; cap: number }[] }[] = (() => {
  const sequencia = [
    // AT
    { id: 'genesis', nome: 'Gênesis', cap: 50 },
    { id: 'exodus', nome: 'Êxodo', cap: 40 },
    { id: 'leviticus', nome: 'Levítico', cap: 27 },
    { id: 'numbers', nome: 'Números', cap: 36 },
    { id: 'deuteronomy', nome: 'Deuteronômio', cap: 34 },
    { id: 'joshua', nome: 'Josué', cap: 24 },
    { id: 'judges', nome: 'Juízes', cap: 21 },
    { id: 'ruth', nome: 'Rute', cap: 4 },
    { id: '1samuel', nome: '1 Samuel', cap: 31 },
    { id: '2samuel', nome: '2 Samuel', cap: 24 },
    { id: '1kings', nome: '1 Reis', cap: 22 },
    { id: '2kings', nome: '2 Reis', cap: 25 },
    { id: '1chronicles', nome: '1 Crônicas', cap: 29 },
    { id: '2chronicles', nome: '2 Crônicas', cap: 36 },
    { id: 'ezra', nome: 'Esdras', cap: 10 },
    { id: 'nehemiah', nome: 'Neemias', cap: 13 },
    { id: 'esther', nome: 'Ester', cap: 10 },
    { id: 'job', nome: 'Jó', cap: 42 },
    { id: 'psalms', nome: 'Salmos', cap: 150 },
    { id: 'proverbs', nome: 'Provérbios', cap: 31 },
    { id: 'ecclesiastes', nome: 'Eclesiastes', cap: 12 },
    { id: 'songofsolomon', nome: 'Cânticos', cap: 8 },
    { id: 'isaiah', nome: 'Isaías', cap: 66 },
    { id: 'jeremiah', nome: 'Jeremias', cap: 52 },
    { id: 'lamentations', nome: 'Lamentações', cap: 5 },
    { id: 'ezekiel', nome: 'Ezequiel', cap: 48 },
    { id: 'daniel', nome: 'Daniel', cap: 12 },
    { id: 'hosea', nome: 'Oseias', cap: 14 },
    { id: 'joel', nome: 'Joel', cap: 3 },
    { id: 'amos', nome: 'Amós', cap: 9 },
    { id: 'obadiah', nome: 'Obadias', cap: 1 },
    { id: 'jonah', nome: 'Jonas', cap: 4 },
    { id: 'micah', nome: 'Miquéias', cap: 7 },
    { id: 'nahum', nome: 'Naum', cap: 3 },
    { id: 'habakkuk', nome: 'Habacuque', cap: 3 },
    { id: 'zephaniah', nome: 'Sofonias', cap: 3 },
    { id: 'haggai', nome: 'Ageu', cap: 2 },
    { id: 'zechariah', nome: 'Zacarias', cap: 14 },
    { id: 'malachi', nome: 'Malaquias', cap: 4 },
    // NT
    { id: 'matthew', nome: 'Mateus', cap: 28 },
    { id: 'mark', nome: 'Marcos', cap: 16 },
    { id: 'luke', nome: 'Lucas', cap: 24 },
    { id: 'john', nome: 'João', cap: 21 },
    { id: 'acts', nome: 'Atos', cap: 28 },
    { id: 'romans', nome: 'Romanos', cap: 16 },
    { id: '1corinthians', nome: '1 Coríntios', cap: 16 },
    { id: '2corinthians', nome: '2 Coríntios', cap: 13 },
    { id: 'galatians', nome: 'Gálatas', cap: 6 },
    { id: 'ephesians', nome: 'Efésios', cap: 6 },
    { id: 'philippians', nome: 'Filipenses', cap: 4 },
    { id: 'colossians', nome: 'Colossenses', cap: 4 },
    { id: '1thessalonians', nome: '1 Tessalonicenses', cap: 5 },
    { id: '2thessalonians', nome: '2 Tessalonicenses', cap: 3 },
    { id: '1timothy', nome: '1 Timóteo', cap: 6 },
    { id: '2timothy', nome: '2 Timóteo', cap: 4 },
    { id: 'titus', nome: 'Tito', cap: 3 },
    { id: 'philemon', nome: 'Filemom', cap: 1 },
    { id: 'hebrews', nome: 'Hebreus', cap: 13 },
    { id: 'james', nome: 'Tiago', cap: 5 },
    { id: '1peter', nome: '1 Pedro', cap: 5 },
    { id: '2peter', nome: '2 Pedro', cap: 3 },
    { id: '1john', nome: '1 João', cap: 5 },
    { id: '2john', nome: '2 João', cap: 1 },
    { id: '3john', nome: '3 João', cap: 1 },
    { id: 'jude', nome: 'Judas', cap: 1 },
    { id: 'revelation', nome: 'Apocalipse', cap: 22 },
  ];

  // Distribui capítulos sequencialmente em 365 dias (~3,4 cap/dia)
  const totalCap = sequencia.reduce((s, l) => s + l.cap, 0); // 1.189
  const dias: { dia: number; leituras: { livroId: string; nome: string; cap: number }[] }[] = [];

  let livroIdx = 0;
  let capAtual = 1;

  for (let dia = 1; dia <= 365; dia++) {
    const capsHoje = dia === 365 ? 999 : Math.round((totalCap / 365));
    const leituras: { livroId: string; nome: string; cap: number }[] = [];
    let count = 0;

    while (livroIdx < sequencia.length && count < (dia === 365 ? 999 : 3)) {
      leituras.push({ livroId: sequencia[livroIdx].id, nome: sequencia[livroIdx].nome, cap: capAtual });
      count++;
      capAtual++;
      if (capAtual > sequencia[livroIdx].cap) {
        capAtual = 1;
        livroIdx++;
      }
      if (livroIdx >= sequencia.length) break;
    }

    if (leituras.length > 0) dias.push({ dia, leituras });
    if (livroIdx >= sequencia.length) break;
  }

  return dias;
})();

function getDiaDoAno(): number {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const STORAGE_KEY = 'sheepcare_plano_leitura';

export default function PlanoLeitura() {
  const [concluidos, setConcluidos] = useState<Set<number>>(new Set());
  const [diaAtual] = useState(getDiaDoAno());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setConcluidos(new Set(JSON.parse(saved)));
  }, []);

  const toggleDia = (dia: number) => {
    setConcluidos(prev => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia); else next.add(dia);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const leituraHoje = PLANO.find(p => p.dia === diaAtual);
  const progresso = concluidos.size;
  const pct = Math.round((progresso / 365) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-7 h-7 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plano de Leitura</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Bíblia em 1 Ano · ~3 capítulos por dia</p>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso geral</span>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progresso}/365 dias · {pct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Leitura de hoje */}
      {leituraHoje && (
        <div className={`rounded-2xl p-5 border-2 ${
          concluidos.has(diaAtual)
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400'
            : 'bg-primary-50 dark:bg-primary-900/20 border-primary-400'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white">📅 Leitura de hoje — Dia {diaAtual}</h2>
            <button
              onClick={() => toggleDia(diaAtual)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                concluidos.has(diaAtual)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {concluidos.has(diaAtual) ? <><CheckCircle className="w-4 h-4" /> Concluído</> : 'Marcar como lido'}
            </button>
          </div>
          <div className="space-y-2">
            {leituraHoje.leituras.map((l, i) => (
              <Link
                key={i}
                href={`/estudo/biblia?livro=${l.livroId}&cap=${l.cap}`}
                className="flex items-center gap-2 text-primary-700 dark:text-primary-300 hover:underline text-sm"
              >
                <span>📖 {l.nome} {l.cap}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lista de dias */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Todos os dias</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
          {PLANO.slice(Math.max(0, diaAtual - 5), diaAtual + 20).map(p => (
            <div
              key={p.dia}
              className={`flex items-center gap-3 px-4 py-3 ${
                p.dia === diaAtual ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <button onClick={() => toggleDia(p.dia)} className="flex-shrink-0">
                {concluidos.has(p.dia)
                  ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                  : <Circle className={`w-5 h-5 ${p.dia === diaAtual ? 'text-primary-500' : 'text-gray-300 dark:text-slate-600'}`} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium mr-2 ${p.dia === diaAtual ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                  Dia {p.dia}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {p.leituras.map(l => `${l.nome} ${l.cap}`).join(' · ')}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">Mostrando dias próximos ao dia atual</p>
      </div>
    </div>
  );
}
