import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

const AT = [
  { id: 'genesis', abbrev: 'gn', nome: 'Gênesis', cap: 50 },
  { id: 'exodus', abbrev: 'ex', nome: 'Êxodo', cap: 40 },
  { id: 'leviticus', abbrev: 'lv', nome: 'Levítico', cap: 27 },
  { id: 'numbers', abbrev: 'nm', nome: 'Números', cap: 36 },
  { id: 'deuteronomy', abbrev: 'dt', nome: 'Deuteronômio', cap: 34 },
  { id: 'joshua', abbrev: 'js', nome: 'Josué', cap: 24 },
  { id: 'judges', abbrev: 'jz', nome: 'Juízes', cap: 21 },
  { id: 'ruth', abbrev: 'rt', nome: 'Rute', cap: 4 },
  { id: '1samuel', abbrev: '1sm', nome: '1 Samuel', cap: 31 },
  { id: '2samuel', abbrev: '2sm', nome: '2 Samuel', cap: 24 },
  { id: '1kings', abbrev: '1rs', nome: '1 Reis', cap: 22 },
  { id: '2kings', abbrev: '2rs', nome: '2 Reis', cap: 25 },
  { id: '1chronicles', abbrev: '1cr', nome: '1 Crônicas', cap: 29 },
  { id: '2chronicles', abbrev: '2cr', nome: '2 Crônicas', cap: 36 },
  { id: 'ezra', abbrev: 'ed', nome: 'Esdras', cap: 10 },
  { id: 'nehemiah', abbrev: 'ne', nome: 'Neemias', cap: 13 },
  { id: 'esther', abbrev: 'et', nome: 'Ester', cap: 10 },
  { id: 'job', abbrev: 'jo', nome: 'Jó', cap: 42 },
  { id: 'psalms', abbrev: 'sl', nome: 'Salmos', cap: 150 },
  { id: 'proverbs', abbrev: 'pv', nome: 'Provérbios', cap: 31 },
  { id: 'ecclesiastes', abbrev: 'ec', nome: 'Eclesiastes', cap: 12 },
  { id: 'songofsolomon', abbrev: 'ct', nome: 'Cânticos', cap: 8 },
  { id: 'isaiah', abbrev: 'is', nome: 'Isaías', cap: 66 },
  { id: 'jeremiah', abbrev: 'jr', nome: 'Jeremias', cap: 52 },
  { id: 'lamentations', abbrev: 'lm', nome: 'Lamentações', cap: 5 },
  { id: 'ezekiel', abbrev: 'ez', nome: 'Ezequiel', cap: 48 },
  { id: 'daniel', abbrev: 'dn', nome: 'Daniel', cap: 12 },
  { id: 'hosea', abbrev: 'os', nome: 'Oseias', cap: 14 },
  { id: 'joel', abbrev: 'jl', nome: 'Joel', cap: 3 },
  { id: 'amos', abbrev: 'am', nome: 'Amós', cap: 9 },
  { id: 'obadiah', abbrev: 'ob', nome: 'Obadias', cap: 1 },
  { id: 'jonah', abbrev: 'jn', nome: 'Jonas', cap: 4 },
  { id: 'micah', abbrev: 'mq', nome: 'Miquéias', cap: 7 },
  { id: 'nahum', abbrev: 'na', nome: 'Naum', cap: 3 },
  { id: 'habakkuk', abbrev: 'hc', nome: 'Habacuque', cap: 3 },
  { id: 'zephaniah', abbrev: 'sf', nome: 'Sofonias', cap: 3 },
  { id: 'haggai', abbrev: 'ag', nome: 'Ageu', cap: 2 },
  { id: 'zechariah', abbrev: 'zc', nome: 'Zacarias', cap: 14 },
  { id: 'malachi', abbrev: 'ml', nome: 'Malaquias', cap: 4 },
];

const NT = [
  { id: 'matthew', abbrev: 'mt', nome: 'Mateus', cap: 28 },
  { id: 'mark', abbrev: 'mc', nome: 'Marcos', cap: 16 },
  { id: 'luke', abbrev: 'lc', nome: 'Lucas', cap: 24 },
  { id: 'john', abbrev: 'jo', nome: 'João', cap: 21 },
  { id: 'acts', abbrev: 'at', nome: 'Atos', cap: 28 },
  { id: 'romans', abbrev: 'rm', nome: 'Romanos', cap: 16 },
  { id: '1corinthians', abbrev: '1co', nome: '1 Coríntios', cap: 16 },
  { id: '2corinthians', abbrev: '2co', nome: '2 Coríntios', cap: 13 },
  { id: 'galatians', abbrev: 'gl', nome: 'Gálatas', cap: 6 },
  { id: 'ephesians', abbrev: 'ef', nome: 'Efésios', cap: 6 },
  { id: 'philippians', abbrev: 'fp', nome: 'Filipenses', cap: 4 },
  { id: 'colossians', abbrev: 'cl', nome: 'Colossenses', cap: 4 },
  { id: '1thessalonians', abbrev: '1ts', nome: '1 Tessalonicenses', cap: 5 },
  { id: '2thessalonians', abbrev: '2ts', nome: '2 Tessalonicenses', cap: 3 },
  { id: '1timothy', abbrev: '1tm', nome: '1 Timóteo', cap: 6 },
  { id: '2timothy', abbrev: '2tm', nome: '2 Timóteo', cap: 4 },
  { id: 'titus', abbrev: 'tt', nome: 'Tito', cap: 3 },
  { id: 'philemon', abbrev: 'fm', nome: 'Filemom', cap: 1 },
  { id: 'hebrews', abbrev: 'hb', nome: 'Hebreus', cap: 13 },
  { id: 'james', abbrev: 'tg', nome: 'Tiago', cap: 5 },
  { id: '1peter', abbrev: '1pe', nome: '1 Pedro', cap: 5 },
  { id: '2peter', abbrev: '2pe', nome: '2 Pedro', cap: 3 },
  { id: '1john', abbrev: '1jo', nome: '1 João', cap: 5 },
  { id: '2john', abbrev: '2jo', nome: '2 João', cap: 1 },
  { id: '3john', abbrev: '3jo', nome: '3 João', cap: 1 },
  { id: 'jude', abbrev: 'jd', nome: 'Judas', cap: 1 },
  { id: 'revelation', abbrev: 'ap', nome: 'Apocalipse', cap: 22 },
];

const TODOS = [...AT, ...NT];

interface Verse { verse: number; text: string; }
interface BibliaBook { abbrev: string; book: string; chapters: string[][]; }

// Cache em memória — carrega uma vez, fica disponível para toda a sessão
let _cache: BibliaBook[] | null = null;
let _loading: Promise<BibliaBook[]> | null = null;

function getBiblia(): Promise<BibliaBook[]> {
  if (_cache) return Promise.resolve(_cache);
  if (_loading) return _loading;
  _loading = fetch('https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/acf.json')
    .then(r => { if (!r.ok) throw new Error('CDN ' + r.status); return r.json(); })
    .then(data => { _cache = data; return data as BibliaBook[]; });
  return _loading;
}

export default function PublicBiblia() {
  const router = useRouter();
  const slug = router.query.slug as string;

  const [livroId, setLivroId] = useState('john');
  const [capitulo, setCapitulo] = useState(3);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [iniciando, setIniciando] = useState(true);
  const [error, setError] = useState('');

  const livro = TODOS.find(l => l.id === livroId)!;

  const carregar = async (bookId: string, cap: number) => {
    setLoading(true);
    setError('');
    try {
      const bible = await getBiblia();
      const entry = TODOS.find(l => l.id === bookId);
      if (!entry) throw new Error('Livro não encontrado');
      const bookData = bible.find(b => b.abbrev === entry.abbrev);
      if (!bookData) throw new Error('Livro não encontrado na Bíblia');
      const chapterArr = bookData.chapters[cap - 1];
      if (!chapterArr) throw new Error('Capítulo não encontrado');
      setVerses(chapterArr.map((text, i) => ({ verse: i + 1, text })));
      setReferencia(entry.nome + ' ' + cap);
    } catch (e: any) {
      setError('Não foi possível carregar. ' + (e?.message || ''));
    } finally {
      setLoading(false);
      setIniciando(false);
    }
  };

  useEffect(() => { carregar('john', 3); }, []);

  const irPara = (bookId: string, cap: number) => {
    setLivroId(bookId);
    setCapitulo(cap);
    carregar(bookId, cap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const anterior = () => {
    if (capitulo > 1) { irPara(livroId, capitulo - 1); }
    else { const idx = TODOS.findIndex(l => l.id === livroId); if (idx > 0) irPara(TODOS[idx-1].id, TODOS[idx-1].cap); }
  };

  const proximo = () => {
    if (capitulo < livro.cap) { irPara(livroId, capitulo + 1); }
    else { const idx = TODOS.findIndex(l => l.id === livroId); if (idx < TODOS.length - 1) irPara(TODOS[idx+1].id, 1); }
  };

  if (!slug) return null;

  return (
    <PublicLayout slug={slug}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bíblia Sagrada</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">João Ferreira de Almeida — Revista e Corrigida</p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select value={livroId} onChange={e => irPara(e.target.value, 1)}
            className="flex-1 min-w-[200px] px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <optgroup label="Antigo Testamento">
              {AT.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </optgroup>
            <optgroup label="Novo Testamento">
              {NT.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </optgroup>
          </select>
          <select value={capitulo} onChange={e => irPara(livroId, Number(e.target.value))}
            className="w-36 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            {Array.from({ length: livro.cap }, (_, i) => i + 1).map(c => (
              <option key={c} value={c}>Capítulo {c}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 min-h-[400px]">
          {(loading || iniciando) ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              {iniciando && <p className="text-xs text-gray-400">Carregando Bíblia...</p>}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-red-500 text-sm">{error}</p>
              <button onClick={() => carregar(livroId, capitulo)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-6 border-b border-gray-100 dark:border-slate-700 pb-3">{referencia}</h2>
              <div className="space-y-4 text-gray-800 dark:text-gray-200 leading-relaxed text-[15px]">
                {verses.map(v => (
                  <p key={v.verse} className="flex gap-2">
                    <span className="text-primary-400 font-bold text-xs mt-1 w-5 flex-shrink-0 text-right select-none">{v.verse}</span>
                    <span>{v.text.trim()}</span>
                  </p>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pb-4">
          <button onClick={anterior} disabled={livroId === 'genesis' && capitulo === 1}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />Anterior
          </button>
          <button onClick={proximo} disabled={livroId === 'revelation' && capitulo === 22}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30">
            Próximo<ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}
