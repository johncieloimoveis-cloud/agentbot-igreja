import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { ImageIcon, Sparkles, Download, MessageCircle, RefreshCw, ChevronDown, User, Calendar } from 'lucide-react';

interface Aniversariante {
  id: string;
  full_name: string;
  date_of_birth: string;
  birth_day: number;
  phone?: string;
  whatsapp?: string;
}

const TEMAS_ANIVERSARIO = [
  'Celebração cristã com flores e balões',
  'Arte aquarela com borboletas e flores',
  'Estilo moderno com confetes dourados',
  'Arte tropical com flores coloridas',
];

const TEMAS_EFEMERIDE = [
  'Culto e adoração',
  'Missões e evangelismo',
  'Família cristã',
  'Páscoa e ressurreição',
  'Natal e nascimento de Cristo',
  'Dia das Mães na igreja',
  'Dia dos Pais na igreja',
  'Aniversário da igreja',
  'Formatura e novos começos',
];

export default function GeradorImagens() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [aba, setAba] = useState<'aniversario' | 'efemeride'>('aniversario');

  // Aniversário
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Aniversariante | null>(null);
  const [nomeLibre, setNomeLibre] = useState('');
  const [temaAniv, setTemaAniv] = useState(TEMAS_ANIVERSARIO[0]);

  // Efeméride
  const [tituloEfem, setTituloEfem] = useState('');
  const [temaEfem, setTemaEfem] = useState(TEMAS_EFEMERIDE[0]);

  // Geração
  const [gerando, setGerando] = useState(false);
  const [imagemUrl, setImagemUrl] = useState('');
  const [erro, setErro] = useState('');
  const [nomeGerado, setNomeGerado] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchWithAuth('/api/admin/aniversariantes-mes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAniversariantes(d); })
      .catch(() => {});
  }, [user]);

  if (!user || !['Arcanjo', 'Querubim'].includes(role || '')) {
    return <div className="p-8 text-gray-500">Acesso restrito.</div>;
  }

  const handleGerar = async () => {
    setErro('');
    setImagemUrl('');

    let nome = '';
    let tema = '';
    let tipo = aba;

    if (aba === 'aniversario') {
      nome = selectedPerson ? selectedPerson.full_name : nomeLibre.trim();
      tema = temaAniv;
      if (!nome) { setErro('Informe o nome do aniversariante.'); return; }
    } else {
      nome = tituloEfem.trim();
      tema = temaEfem;
      if (!nome) { setErro('Informe o tema da efeméride.'); return; }
    }

    setGerando(true);
    setNomeGerado(nome);
    try {
      const res = await fetchWithAuth('/api/admin/generate-image', {
        method: 'POST',
        body: JSON.stringify({ tipo, nome, tema }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImagemUrl(data.url);
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar imagem.');
    } finally {
      setGerando(false);
    }
  };

  const buildWhatsApp = () => {
    if (!nomeGerado) return '';
    const msg = aba === 'aniversario'
      ? `🎂 Feliz Aniversário, ${nomeGerado}!\n\nQue Deus abençoe ricamente sua vida neste novo ano. A família da nossa igreja celebra com você! 🙏`
      : `✨ ${nomeGerado}\n\nDeus seja louvado! 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-7 h-7 text-violet-500" />
          Gerador de Imagens IA
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Crie imagens comemorativas quadradas com inteligência artificial
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setAba('aniversario'); setImagemUrl(''); setErro(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${aba === 'aniversario' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
        >
          <Calendar className="w-4 h-4" /> Aniversário
        </button>
        <button
          onClick={() => { setAba('efemeride'); setImagemUrl(''); setErro(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${aba === 'efemeride' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
        >
          <Sparkles className="w-4 h-4" /> Efeméride
        </button>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4 mb-6">
        {aba === 'aniversario' ? (
          <>
            {/* Aniversariantes do mês */}
            {aniversariantes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aniversariantes do mês
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {aniversariantes.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPerson(p === selectedPerson ? null : p); setNomeLibre(''); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${selectedPerson?.id === p.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-gray-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600'}`}
                    >
                      <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span className="flex-1 font-medium">{p.full_name}</span>
                      <span className="text-gray-400 text-xs">dia {p.birth_day}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">— ou —</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome do aniversariante
              </label>
              <input
                type="text"
                value={selectedPerson ? selectedPerson.full_name : nomeLibre}
                onChange={e => { setNomeLibre(e.target.value); setSelectedPerson(null); }}
                placeholder="Digite o nome..."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Estilo visual
              </label>
              <select
                value={temaAniv}
                onChange={e => setTemaAniv(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {TEMAS_ANIVERSARIO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Título / Ocasião
              </label>
              <input
                type="text"
                value={tituloEfem}
                onChange={e => setTituloEfem(e.target.value)}
                placeholder="Ex: Dia das Mães 2025, Páscoa..."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tema
              </label>
              <select
                value={temaEfem}
                onChange={e => setTemaEfem(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {TEMAS_EFEMERIDE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {erro}
        </div>
      )}

      <button
        onClick={handleGerar}
        disabled={gerando}
        className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors mb-6"
      >
        {gerando ? (
          <><RefreshCw className="w-5 h-5 animate-spin" /> Gerando imagem com IA...</>
        ) : (
          <><Sparkles className="w-5 h-5" /> Gerar Imagem</>
        )}
      </button>

      {/* Resultado */}
      {imagemUrl && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <img
            src={imagemUrl}
            alt="Imagem gerada"
            className="w-full aspect-square object-cover"
          />
          <div className="p-4 flex gap-3">
            <a
              href={imagemUrl}
              download={`${nomeGerado.replace(/\s+/g, '-')}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Baixar
            </a>
            <a
              href={buildWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <button
              onClick={() => { setImagemUrl(''); setErro(''); }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Nova
            </button>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Dica: no celular, pressione a imagem por alguns segundos para salvar. Depois annexe no WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
