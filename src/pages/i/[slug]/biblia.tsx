import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

const AT = [
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
];

const NT = [
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

const TODOS = [...AT, ...NT];

interface Verse { verse: number; text: string; }

export default function PublicBiblia() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const [livroId, setLivroId] = useState('john');
  const [capitulo, setCapitulo] = useState(3);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const livro = TODOS.find(l => l.id === livroId)!;

  const carregar = async (bookId: string, cap: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://bible-api.com/' + bookId + '+' + cap + '?translation=almeida');
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setVerses(data.verses || []);
      const nome = TODOS.find(l => l.id === bookId)?.nome || '';
      setReferencia(nome + ' ' + cap);
    } catch {
      setError('Nao foi possivel carregar. Verifique sua conexao.');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblia Sagrada</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Joao Ferreira de Almeida - Dominio Publico</p>
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
              <option key={c} value={c}>Capitulo {c}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-red-500">{error}</p>
              <button onClick={() => carregar(livroId, capitulo)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Tentar novamente</button>
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
            Proximo<ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}
