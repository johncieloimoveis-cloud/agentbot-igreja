import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import {
  Calendar, Users, Sparkles, Download, MessageCircle,
  RefreshCw, Star,
} from 'lucide-react';

// ─── Helpers de calendário ───────────────────────────────────────────────────

function calcPascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function nthSunday(ano: number, mes: number, n: number): Date {
  const d = new Date(ano, mes - 1, 1);
  const first = d.getDay() === 0 ? 1 : 8 - d.getDay();
  return new Date(ano, mes - 1, first + (n - 1) * 7);
}

// ─── Lista de datas comemorativas ────────────────────────────────────────────

interface DataCom {
  label: string;
  descricao: string;
  icone: string;
  categoria: 'profissional' | 'familia' | 'religioso' | 'nacional' | 'igreja';
  calcData: (ano: number) => Date;
}

const DATAS: DataCom[] = [
  // Família
  { label: 'Dia das Mães', icone: '💐', categoria: 'familia', descricao: 'Honrando as mães com amor cristão', calcData: a => nthSunday(a, 5, 2) },
  { label: 'Dia dos Pais', icone: '👔', categoria: 'familia', descricao: 'Honrando os pais e líderes do lar', calcData: a => nthSunday(a, 8, 2) },
  { label: 'Dia dos Avós', icone: '🧡', categoria: 'familia', descricao: 'Honrando a sabedoria e o amor dos avós', calcData: a => nthSunday(a, 7, 2) },
  { label: 'Dia dos Namorados', icone: '💑', categoria: 'familia', descricao: 'Amor baseado em 1 Coríntios 13', calcData: a => new Date(a, 5, 12) },
  { label: 'Dia das Crianças', icone: '🧒', categoria: 'familia', descricao: 'Deixai os pequeninos virem a mim', calcData: a => new Date(a, 9, 12) },
  { label: 'Dia do Idoso', icone: '🌿', categoria: 'familia', descricao: 'Honrando os que viveram com sabedoria', calcData: a => new Date(a, 9, 1) },
  // Profissional
  { label: 'Dia do Professor', icone: '📚', categoria: 'profissional', descricao: 'Honrando quem ensina e transforma vidas', calcData: a => new Date(a, 9, 15) },
  { label: 'Dia do Médico', icone: '🩺', categoria: 'profissional', descricao: 'Reconhecendo o dom da cura e cuidado', calcData: a => new Date(a, 9, 18) },
  { label: 'Dia do Enfermeiro(a)', icone: '💉', categoria: 'profissional', descricao: 'Gratidão pelo serviço de cuidado ao próximo', calcData: a => new Date(a, 4, 12) },
  { label: 'Dia do Radialista', icone: '📻', categoria: 'profissional', descricao: 'Valorizando quem leva a voz da verdade ao ar', calcData: a => new Date(a, 7, 1) },
  { label: 'Dia do Advogado', icone: '⚖️', categoria: 'profissional', descricao: 'Honrando quem busca justiça e direito', calcData: a => new Date(a, 7, 11) },
  { label: 'Dia do Estudante', icone: '🎓', categoria: 'profissional', descricao: 'Incentivando quem busca conhecimento e sabedoria', calcData: a => new Date(a, 7, 11) },
  { label: 'Dia do Músico', icone: '🎵', categoria: 'profissional', descricao: 'Celebrando quem usa a música para glorificar a Deus', calcData: a => new Date(a, 10, 22) },
  { label: 'Dia do Engenheiro', icone: '🔧', categoria: 'profissional', descricao: 'Reconhecendo quem constrói com excelência', calcData: a => new Date(a, 11, 11) },
  { label: 'Dia do Jornalista', icone: '📰', categoria: 'profissional', descricao: 'Honrando quem busca e comunica a verdade', calcData: a => new Date(a, 5, 1) },
  { label: 'Dia Internacional da Mulher', icone: '🌸', categoria: 'nacional', descricao: 'Celebrando a força e graça da mulher cristã', calcData: a => new Date(a, 2, 8) },
  { label: 'Dia do Trabalhador', icone: '🛠️', categoria: 'nacional', descricao: 'Dignidade e fé no trabalho cotidiano', calcData: a => new Date(a, 4, 1) },
  // Religioso / Igreja
  { label: 'Páscoa', icone: '✝️', categoria: 'religioso', descricao: 'Cristo ressuscitou — a morte foi vencida', calcData: calcPascoa },
  { label: 'Domingo de Ramos', icone: '🌿', categoria: 'religioso', descricao: 'Entrada triunfal de Jesus em Jerusalém', calcData: a => { const p = calcPascoa(a); return new Date(p.getTime() - 7 * 86400000); } },
  { label: 'Sexta-feira Santa', icone: '🕯️', categoria: 'religioso', descricao: 'Paixão e morte de Cristo por nós', calcData: a => { const p = calcPascoa(a); return new Date(p.getTime() - 2 * 86400000); } },
  { label: 'Pentecostes', icone: '🔥', categoria: 'religioso', descricao: 'Derramamento do Espírito Santo — Atos 2', calcData: a => { const p = calcPascoa(a); return new Date(p.getTime() + 49 * 86400000); } },
  { label: 'Reforma Protestante', icone: '📖', categoria: 'religioso', descricao: 'Sola Scriptura, Sola Fide, Sola Gratia', calcData: a => new Date(a, 9, 31) },
  { label: 'Dia da Bíblia', icone: '📕', categoria: 'religioso', descricao: 'A Palavra de Deus é lâmpada aos meus pés', calcData: a => new Date(a, 10, 16) },
  { label: 'Natal de Cristo', icone: '⭐', categoria: 'religioso', descricao: 'O Verbo se fez carne — João 1:14', calcData: a => new Date(a, 11, 25) },
  { label: 'Véspera de Natal', icone: '🕯️', categoria: 'religioso', descricao: 'Noite Santa — Esperança que nasce', calcData: a => new Date(a, 11, 24) },
  { label: 'Ano Novo Cristão', icone: '🎆', categoria: 'religioso', descricao: 'Nova criação, novas misericórdias — Lamentações 3:23', calcData: a => new Date(a, 0, 1) },
  // Igreja específico
  { label: 'Dia do Pastor', icone: '🐑', categoria: 'igreja', descricao: 'Honrando o servo que apascenta o rebanho', calcData: a => new Date(a, 0, 20) },
  { label: 'Dia do Evangelista', icone: '📢', categoria: 'igreja', descricao: 'Ide e pregai o Evangelho a toda criatura', calcData: a => new Date(a, 9, 19) },
  { label: 'Dia das Missões Mundiais', icone: '🌍', categoria: 'igreja', descricao: 'Toda nação, tribo, língua e povo — Ap 7:9', calcData: a => new Date(a, 9, 20) },
  { label: 'Dia do Voluntário', icone: '🤝', categoria: 'igreja', descricao: 'Servindo com amor e sem esperar recompensa', calcData: a => new Date(a, 11, 5) },
];

function getProximosDias(janela = 14) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje.getTime() + janela * 86400000);
  const ano = hoje.getFullYear();

  const result: Array<DataCom & { data: Date }> = [];
  for (const d of DATAS) {
    let data = d.calcData(ano);
    if (data < hoje) data = d.calcData(ano + 1);
    if (data >= hoje && data <= limite) result.push({ ...d, data });
  }
  return result.sort((a, b) => a.data.getTime() - b.data.getTime());
}

// ─── Estilos visuais ─────────────────────────────────────────────────────────

const ESTILOS = [
  { value: 'Aquarela bíblica com luz divina e flores delicadas', label: '🎨 Aquarela bíblica' },
  { value: 'Pintura clássica com Bíblia aberta, cruz dourada e luz celestial', label: '✝️ Clássico cristão' },
  { value: 'Arte digital moderna com raios de luz divina e tons dourados', label: '✨ Moderno luminoso' },
  { value: 'Estilo floral com rosas e oliveiras em luz suave e pastoral', label: '🌸 Floral e pastoral' },
  { value: 'Arte sacra majestosa com ouro, mosaico e símbolos do Espírito Santo', label: '🌟 Sacro majestoso' },
];

const CATEGORIA_COR: Record<string, string> = {
  profissional: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
  familia:      'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300',
  religioso:    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300',
  nacional:     'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300',
  igreja:       'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300',
};

interface Aniversariante { id: string; full_name: string; date_of_birth: string; }
interface EventoSelecionado {
  tipo: 'aniversario' | 'data';
  nome: string;        // nome da pessoa ou da data
  descricao: string;
  subtitulo?: string;  // "Aniversário – 29 anos" ou data formatada
}

// ─── Componente principal ────────────────────────────────────────────────────

function GeradorImagens() {
  // Dados
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loadingAniv, setLoadingAniv] = useState(true);

  // Evento selecionado
  const [evento, setEvento] = useState<EventoSelecionado | null>(null);

  // Geração
  const [estilo, setEstilo] = useState(ESTILOS[0].value);
  const [gerando, setGerando] = useState(false);
  const [imagemUrl, setImagemUrl] = useState('');
  const [erro, setErro] = useState('');

  const datasProximas = getProximosDias(14);

  useEffect(() => {
    fetchWithAuth('/api/admin/aniversariantes-mes')
      .then(r => r.json())
      .then(d => {
        if (d.people) {
          // Filtra os próximos 14 dias
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const limite = new Date(hoje.getTime() + 14 * 86400000);
          const filtrados = d.people.filter((p: Aniversariante) => {
            const [, mes, dia] = p.date_of_birth.split('-').map(Number);
            const proxData = new Date(hoje.getFullYear(), mes - 1, dia);
            if (proxData < hoje) proxData.setFullYear(hoje.getFullYear() + 1);
            return proxData >= hoje && proxData <= limite;
          });
          // Sort by upcoming date
          filtrados.sort((a: Aniversariante, b: Aniversariante) => {
            const dataA = (() => { const [, m, d] = a.date_of_birth.split('-').map(Number); const dt = new Date(new Date().getFullYear(), m-1, d); if (dt < new Date()) dt.setFullYear(dt.getFullYear()+1); return dt; })();
            const dataB = (() => { const [, m, d] = b.date_of_birth.split('-').map(Number); const dt = new Date(new Date().getFullYear(), m-1, d); if (dt < new Date()) dt.setFullYear(dt.getFullYear()+1); return dt; })();
            return dataA.getTime() - dataB.getTime();
          });
          setAniversariantes(filtrados);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAniv(false));
  }, []);

  const selecionarAniversariante = (p: Aniversariante) => {
    const [ano, mes, dia] = p.date_of_birth.split('-').map(Number);
    const hoje = new Date();
    const idade = hoje.getFullYear() - ano - (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia) ? 1 : 0) + 1;
    const dataFmt = new Date(hoje.getFullYear(), mes - 1, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    setEvento({
      tipo: 'aniversario',
      nome: p.full_name,
      descricao: `Parabéns pelo aniversário, ${p.full_name.split(' ')[0]}! Que Deus te abençoe e te guarde em mais um ano de vida.`,
      subtitulo: `🎂 ${dataFmt}${idade > 0 ? ` — ${idade} anos` : ''}`,
    });
    setImagemUrl('');
    setErro('');
  };

  const selecionarData = (d: DataCom & { data: Date }) => {
    const dataFmt = d.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    setEvento({
      tipo: 'data',
      nome: d.label,
      descricao: d.descricao,
      subtitulo: `${d.icone} ${dataFmt}`,
    });
    setImagemUrl('');
    setErro('');
  };

  const handleGerar = async () => {
    if (!evento) return;
    setGerando(true); setErro(''); setImagemUrl('');
    try {
      const body = evento.tipo === 'aniversario'
        ? { tipo: 'aniversario', nome: evento.nome, tema: estilo }
        : { tipo: 'efemeride', descricao: `${evento.nome} — ${evento.descricao}`, tema: estilo };
      const res = await fetchWithAuth('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      setImagemUrl(data.url);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  };

  const whatsappUrl = imagemUrl
    ? `https://wa.me/?text=${encodeURIComponent(`🙏 ${evento?.nome || ''}\n\n${evento?.descricao || ''}\n\n📷 Imagem: ${imagemUrl}`)}`
    : '';

  const temEventos = aniversariantes.length > 0 || datasProximas.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerador de Cartões</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Próximos 14 dias — aniversários e datas especiais</p>
        </div>
      </div>

      {/* ── Próximos eventos ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Próximos eventos</span>
          <span className="ml-auto text-xs text-gray-400">Selecione um para gerar o cartão</span>
        </div>

        {/* Aniversariantes */}
        {loadingAniv ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">Carregando aniversariantes...</div>
        ) : aniversariantes.length > 0 ? (
          <div className="p-3 space-y-1.5 border-b border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Aniversariantes da igreja
            </p>
            {aniversariantes.map(p => {
              const [, mes, dia] = p.date_of_birth.split('-').map(Number);
              const hoje = new Date();
              const proxData = new Date(hoje.getFullYear(), mes - 1, dia);
              if (proxData < hoje) proxData.setFullYear(hoje.getFullYear() + 1);
              const isHoje = proxData.toDateString() === hoje.toDateString();
              const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
              const isAmanha = proxData.toDateString() === amanha.toDateString();
              const label = isHoje ? '🎉 Hoje!' : isAmanha ? 'Amanhã' : proxData.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              const sel = evento?.tipo === 'aniversario' && evento.nome === p.full_name;
              return (
                <button
                  key={p.id}
                  onClick={() => selecionarAniversariante(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${sel ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600'}`}
                >
                  <span className="text-xl">🎂</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${sel ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-100'}`}>{p.full_name}</p>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ${isHoje ? 'text-red-500' : 'text-gray-400'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        ) : !loadingAniv && (
          <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700">
            <Users className="w-4 h-4" /> Nenhum aniversariante nos próximos 14 dias
          </div>
        )}

        {/* Datas comemorativas */}
        <div className="p-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> Datas comemorativas
          </p>
          {datasProximas.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-2">Nenhuma data especial nos próximos 14 dias.</p>
          ) : datasProximas.map(d => {
            const isHoje = d.data.toDateString() === new Date().toDateString();
            const amanha = new Date(); amanha.setDate(new Date().getDate() + 1);
            const isAmanha = d.data.toDateString() === amanha.toDateString();
            const label = isHoje ? '🎉 Hoje!' : isAmanha ? 'Amanhã' : d.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            const sel = evento?.tipo === 'data' && evento.nome === d.label;
            return (
              <button
                key={d.label + d.data.toISOString()}
                onClick={() => selecionarData(d)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${sel ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600'}`}
              >
                <span className="text-xl">{d.icone}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${sel ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-100'}`}>{d.label}</p>
                  <p className="text-xs text-gray-400 truncate">{d.descricao}</p>
                </div>
                <span className={`text-xs font-semibold flex-shrink-0 ${isHoje ? 'text-red-500' : 'text-gray-400'}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {!temEventos && !loadingAniv && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            Nenhum evento especial nos próximos 14 dias. Tente selecionar uma data personalizada abaixo.
          </div>
        )}
      </div>

      {/* ── Painel de geração ────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Gerar cartão</span>
        </div>
        <div className="p-4 space-y-4">
          {/* Evento selecionado */}
          {evento ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200 truncate">{evento.nome}</p>
                {evento.subtitulo && <p className="text-xs text-violet-600 dark:text-violet-400">{evento.subtitulo}</p>}
              </div>
              <button onClick={() => { setEvento(null); setImagemUrl(''); }} className="text-violet-400 hover:text-violet-600 text-lg leading-none">×</button>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-dashed border-gray-300 dark:border-slate-600 text-center text-sm text-gray-400">
              ← Selecione um aniversariante ou data comemorativa acima
            </div>
          )}

          {/* Estilo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estilo visual</label>
            <select
              value={estilo}
              onChange={e => setEstilo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            >
              {ESTILOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          {/* Erro */}
          {erro && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{erro}</p>}

          {/* Botão gerar */}
          <button
            onClick={handleGerar}
            disabled={gerando || !evento}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {gerando ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar imagem com IA</>}
          </button>
        </div>
      </div>

      {/* ── Resultado ───────────────────────────────── */}
      {imagemUrl && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Imagem gerada</p>
          <img src={imagemUrl} alt="Cartão gerado" className="w-full rounded-xl shadow-md" />
          <p className="text-xs text-gray-400 text-center">No celular, pressione a imagem por alguns segundos para salvar na galeria.</p>
          <div className="grid grid-cols-2 gap-3">
            <a href={imagemUrl} download="cartao-agentbot.png"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download className="w-4 h-4" /> Baixar
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium text-white transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
          <button onClick={() => setImagemUrl('')}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Gerar nova imagem
          </button>
        </div>
      )}
    </div>
  );
}

export default function GeradorImagensPage() {
  return <GeradorImagens />;
}

