import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import {
  Calendar, Users, Sparkles, Download, MessageCircle,
  RefreshCw, Star, Edit3, Check,
} from 'lucide-react';

// ─── Helpers de calendário ────────────────────────────────────────────────────
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

// ─── Datas comemorativas ──────────────────────────────────────────────────────
interface DataCom {
  label: string; descricao: string; icone: string;
  categoria: string; versiculo: string;
  calcData: (ano: number) => Date;
}
const DATAS: DataCom[] = [
  { label: 'Dia das Mães', icone: '💐', categoria: 'familia', descricao: 'Honrando as mães com amor cristão', versiculo: '"Seus filhos se levantam e lhe chamam feliz." — Provérbios 31:28', calcData: a => nthSunday(a, 5, 2) },
  { label: 'Dia dos Pais', icone: '👔', categoria: 'familia', descricao: 'Honrando os pais e líderes do lar', versiculo: '"Honra teu pai e tua mãe." — Êxodo 20:12', calcData: a => nthSunday(a, 8, 2) },
  { label: 'Dia dos Avós', icone: '🧡', categoria: 'familia', descricao: 'Honrando a sabedoria dos avós', versiculo: '"Os netos são a coroa dos velhos." — Provérbios 17:6', calcData: a => nthSunday(a, 7, 2) },
  { label: 'Dia das Crianças', icone: '🧒', categoria: 'familia', descricao: 'Deixai os pequeninos virem a mim', versiculo: '"Deixai as crianças virem a mim." — Mateus 19:14', calcData: a => new Date(a, 9, 12) },
  { label: 'Dia do Idoso', icone: '🌿', categoria: 'familia', descricao: 'Honrando os que viveram com sabedoria', versiculo: '"Diante das cãs te levantarás." — Levítico 19:32', calcData: a => new Date(a, 9, 1) },
  { label: 'Dia dos Namorados', icone: '💑', categoria: 'familia', descricao: 'Amor baseado em 1 Coríntios 13', versiculo: '"O amor é paciente, o amor é bondoso." — 1 Coríntios 13:4', calcData: a => new Date(a, 5, 12) },
  { label: 'Dia do Professor', icone: '📚', categoria: 'profissional', descricao: 'Honrando quem ensina e transforma vidas', versiculo: '"O medo do Senhor é o princípio da sabedoria." — Provérbios 9:10', calcData: a => new Date(a, 9, 15) },
  { label: 'Dia do Médico', icone: '🩺', categoria: 'profissional', descricao: 'Reconhecendo o dom da cura e cuidado', versiculo: '"Dai graças ao Senhor, pois ele é bom." — Salmos 107:1', calcData: a => new Date(a, 9, 18) },
  { label: 'Dia do Enfermeiro(a)', icone: '💉', categoria: 'profissional', descricao: 'Gratidão pelo serviço de cuidado ao próximo', versiculo: '"Servi-vos uns aos outros por amor." — Gálatas 5:13', calcData: a => new Date(a, 4, 12) },
  { label: 'Dia do Radialista', icone: '📻', categoria: 'profissional', descricao: 'Valorizando quem leva a voz da verdade ao ar', versiculo: '"Como são formosos os pés dos que anunciam boas novas!" — Romanos 10:15', calcData: a => new Date(a, 7, 1) },
  { label: 'Dia do Advogado', icone: '⚖️', categoria: 'profissional', descricao: 'Honrando quem busca justiça e direito', versiculo: '"Praticai a justiça e o direito." — Jeremias 22:3', calcData: a => new Date(a, 7, 11) },
  { label: 'Dia do Estudante', icone: '🎓', categoria: 'profissional', descricao: 'Incentivando quem busca conhecimento', versiculo: '"Adquire sabedoria e inteligência." — Provérbios 4:5', calcData: a => new Date(a, 7, 11) },
  { label: 'Dia do Músico', icone: '🎵', categoria: 'profissional', descricao: 'Celebrando quem usa a música para glorificar a Deus', versiculo: '"Cantai ao Senhor um cântico novo." — Salmos 96:1', calcData: a => new Date(a, 10, 22) },
  { label: 'Dia do Jornalista', icone: '📰', categoria: 'profissional', descricao: 'Honrando quem busca e comunica a verdade', versiculo: '"E conhecereis a verdade, e a verdade vos libertará." — João 8:32', calcData: a => new Date(a, 5, 1) },
  { label: 'Dia Internacional da Mulher', icone: '🌸', categoria: 'nacional', descricao: 'Celebrando a força e graça da mulher cristã', versiculo: '"A mulher virtuosa é coroa do seu marido." — Provérbios 12:4', calcData: a => new Date(a, 2, 8) },
  { label: 'Dia do Trabalhador', icone: '🛠️', categoria: 'nacional', descricao: 'Dignidade e fé no trabalho cotidiano', versiculo: '"Tudo que fizeres, fazei de coração, como ao Senhor." — Colossenses 3:23', calcData: a => new Date(a, 4, 1) },
  { label: 'Dia Nacional do Agricultor', icone: '🌾', categoria: 'profissional', descricao: 'Honrando quem cultiva a terra com fé e trabalho', versiculo: '"Os que semeiam em lágrimas colherão com alegria." — Salmos 126:5', calcData: a => new Date(a, 6, 28) },
  { label: 'Dia do Pedreiro', icone: '🧱', categoria: 'profissional', descricao: 'Honrando quem constrói com as próprias mãos', versiculo: '"Se o Senhor não edificar a casa, em vão trabalham os que a edificam." — Salmos 127:1', calcData: a => new Date(a, 9, 9) },
  { label: 'Dia da Secretária', icone: '💼', categoria: 'profissional', descricao: 'Valorizando a dedicação e a organização no serviço', versiculo: '"Tudo que fizer, de coração o fazei, como ao Senhor." — Colossenses 3:23', calcData: a => new Date(a, 8, 30) },
  { label: 'Dia do Motorista', icone: '🚗', categoria: 'profissional', descricao: 'Gratidão por quem conduz com responsabilidade', versiculo: '"O Senhor guardará a tua saída e a tua entrada." — Salmos 121:8', calcData: a => new Date(a, 6, 25) },
  { label: 'Dia da Independência do Brasil', icone: '🇧🇷', categoria: 'nacional', descricao: 'Gratidão pela nação que Deus nos deu', versiculo: '"Bem-aventurada a nação cujo Deus é o Senhor." — Salmos 33:12', calcData: a => new Date(a, 8, 7) },
  { label: 'Páscoa', icone: '✝️', categoria: 'religioso', descricao: 'Cristo ressuscitou — a morte foi vencida', versiculo: '"Eu sou a ressurreição e a vida." — João 11:25', calcData: calcPascoa },
  { label: 'Pentecostes', icone: '🔥', categoria: 'religioso', descricao: 'Derramamento do Espírito Santo', versiculo: '"Recebereis poder, ao descer sobre vós o Espírito Santo." — Atos 1:8', calcData: a => { const p = calcPascoa(a); return new Date(p.getTime() + 49 * 86400000); } },
  { label: 'Reforma Protestante', icone: '📖', categoria: 'religioso', descricao: 'Sola Scriptura, Sola Fide, Sola Gratia', versiculo: '"O justo viverá pela fé." — Romanos 1:17', calcData: a => new Date(a, 9, 31) },
  { label: 'Dia da Bíblia', icone: '📕', categoria: 'religioso', descricao: 'A Palavra de Deus é lâmpada aos meus pés', versiculo: '"Lâmpada para os meus pés é tua palavra." — Salmos 119:105', calcData: a => new Date(a, 10, 16) },
  { label: 'Natal de Cristo', icone: '⭐', categoria: 'religioso', descricao: 'O Verbo se fez carne — João 1:14', versiculo: '"O Verbo se fez carne e habitou entre nós." — João 1:14', calcData: a => new Date(a, 11, 25) },
  { label: 'Ano Novo Cristão', icone: '🎆', categoria: 'religioso', descricao: 'Novas misericórdias a cada manhã', versiculo: '"As misericórdias do Senhor se renovam cada manhã." — Lamentações 3:23', calcData: a => new Date(a, 0, 1) },
  { label: 'Dia do Pastor', icone: '🐑', categoria: 'igreja', descricao: 'Honrando o servo que apascenta o rebanho', versiculo: '"Apascenta as minhas ovelhas." — João 21:17', calcData: a => new Date(a, 0, 20) },
  { label: 'Dia do Evangelista', icone: '📢', categoria: 'igreja', descricao: 'Ide e pregai o Evangelho a toda criatura', versiculo: '"Ide por todo o mundo e pregai o evangelho." — Marcos 16:15', calcData: a => new Date(a, 9, 19) },
  { label: 'Dia das Missões Mundiais', icone: '🌍', categoria: 'igreja', descricao: 'Toda nação, tribo, língua e povo', versiculo: '"Ide e fazei discípulos de todas as nações." — Mateus 28:19', calcData: a => new Date(a, 9, 20) },
  { label: 'Domingo de Ramos', icone: '🌿', categoria: 'religioso', descricao: 'Entrada triunfal de Jesus em Jerusalém', versiculo: '"Bendito o que vem em nome do Senhor!" — Mateus 21:9', calcData: a => { const p = calcPascoa(a); return new Date(p.getTime() - 7 * 86400000); } },
];

const VERSICULOS_ANIVERSARIO = [
  '"Que o Senhor te abençoe e te guarde." — Números 6:24',
  '"Pois eu sei os planos que tenho para você, planos de prosperidade." — Jeremias 29:11',
  '"Deleita-te no Senhor, e ele satisfará os desejos do teu coração." — Salmos 37:4',
  '"Vim para que tenham vida, e a tenham em abundância." — João 10:10',
  '"Ele renova a minha força. Eles voam alto como águias." — Isaías 40:31',
];

const ESTILOS = [
  { value: 'Aquarela bíblica com luz divina e flores delicadas', label: '🎨 Aquarela bíblica' },
  { value: 'Pintura clássica com Bíblia aberta, cruz dourada e luz celestial', label: '✝️ Clássico cristão' },
  { value: 'Arte digital moderna com raios de luz divina e tons dourados', label: '✨ Moderno luminoso' },
  { value: 'Estilo floral com rosas e oliveiras em luz suave e pastoral', label: '🌸 Floral e pastoral' },
  { value: 'Arte sacra majestosa com ouro, mosaico e símbolos do Espírito Santo', label: '🌟 Sacro majestoso' },
];

function getProximosDias(janela = 14) {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const limite = new Date(hoje.getTime() + janela * 86400000);
  const ano = hoje.getFullYear();
  return DATAS
    .map(d => { let data = d.calcData(ano); if (data < hoje) data = d.calcData(ano+1); return { ...d, data }; })
    .filter(d => d.data >= hoje && d.data <= limite)
    .sort((a, b) => a.data.getTime() - b.data.getTime());
}

// ─── Composição do cartão com Canvas ─────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else { line = testLine; }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

async function composeCard(imageUrl: string, titulo: string, mensagem: string, versiculo: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      // Gradient overlay bottom half
      const grad = ctx.createLinearGradient(0, 500, 0, 1024);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0.82)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);
      // Title
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 56px Georgia, serif';
      ctx.fillText(titulo, 512, 720);
      // Message
      ctx.font = '34px Georgia, serif';
      ctx.fillStyle = '#F0E6D3';
      wrapText(ctx, mensagem, 512, 790, 880, 42);
      // Bible verse
      ctx.font = 'italic 28px Georgia, serif';
      ctx.fillStyle = '#FFD700';
      wrapText(ctx, versiculo, 512, 910, 880, 36);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      // For data URLs (base64), crossOrigin fails — retry without it
      const img2 = new Image();
      img2.onload = () => {
        ctx.drawImage(img2, 0, 0, 1024, 1024);
        const grad = ctx.createLinearGradient(0, 500, 0, 1024);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, 'rgba(0,0,0,0.55)');
        grad.addColorStop(1, 'rgba(0,0,0,0.82)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 56px Georgia, serif';
        ctx.fillText(titulo, 512, 720);
        ctx.font = '34px Georgia, serif';
        ctx.fillStyle = '#F0E6D3';
        wrapText(ctx, mensagem, 512, 790, 880, 42);
        ctx.font = 'italic 28px Georgia, serif';
        ctx.fillStyle = '#FFD700';
        wrapText(ctx, versiculo, 512, 910, 880, 36);
        resolve(canvas.toDataURL('image/png'));
      };
      img2.onerror = reject;
      img2.src = imageUrl;
    };
    img.src = imageUrl;
  });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Aniversariante { id: string; full_name: string; date_of_birth: string; }
interface EventoSelecionado {
  tipo: 'aniversario' | 'data';
  nome: string; descricao: string; subtitulo?: string;
  versiculo: string; mensagem: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function GeradorImagensPage() {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loadingAniv, setLoadingAniv] = useState(true);
  const [evento, setEvento] = useState<EventoSelecionado | null>(null);
  const [estilo, setEstilo] = useState(ESTILOS[0].value);
  const [gerando, setGerando] = useState(false);
  const [imagemBg, setImagemBg] = useState(''); // fundo gerado pela IA
  const [cardUrl, setCardUrl] = useState('');    // cartão composto
  const [erro, setErro] = useState('');
  // Textos editáveis do cartão
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [versiculo, setVersiculo] = useState('');
  const [editando, setEditando] = useState(false);
  const [compondo, setCompondo] = useState(false);

  const datasProximas = getProximosDias(14);

  useEffect(() => {
    fetchWithAuth('/api/admin/aniversariantes-mes')
      .then(r => r.json())
      .then(d => {
        if (!d.people) return;
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const limite = new Date(hoje.getTime() + 14 * 86400000);
        const filtrados = d.people.filter((p: Aniversariante) => {
          const [, mes, dia] = p.date_of_birth.split('-').map(Number);
          const dt = new Date(hoje.getFullYear(), mes-1, dia);
          if (dt < hoje) dt.setFullYear(hoje.getFullYear()+1);
          return dt >= hoje && dt <= limite;
        }).sort((a: Aniversariante, b: Aniversariante) => {
          const getD = (p: Aniversariante) => { const [,m,d] = p.date_of_birth.split('-').map(Number); const dt = new Date(new Date().getFullYear(), m-1, d); if (dt < new Date()) dt.setFullYear(dt.getFullYear()+1); return dt; };
          return getD(a).getTime() - getD(b).getTime();
        });
        setAniversariantes(filtrados);
      }).catch(() => {}).finally(() => setLoadingAniv(false));
  }, []);

  const selecionarAniversariante = (p: Aniversariante) => {
    const [, mes, dia] = p.date_of_birth.split('-').map(Number);
    const hoje = new Date();
    const dataFmt = new Date(hoje.getFullYear(), mes-1, dia).toLocaleDateString('pt-BR', { day:'2-digit', month:'long' });
    const primeiro = p.full_name.split(' ')[0];
    const vers = VERSICULOS_ANIVERSARIO[Math.floor(Math.random() * VERSICULOS_ANIVERSARIO.length)];
    const ev: EventoSelecionado = {
      tipo: 'aniversario', nome: p.full_name,
      descricao: `Aniversário de ${primeiro}`,
      subtitulo: `🎂 ${dataFmt}`,
      mensagem: `Feliz Aniversário, ${primeiro}! Que Deus te abençoe e te guarde em mais um ano de vida!`,
      versiculo: vers,
    };
    setEvento(ev); setTitulo(`🎂 Feliz Aniversário, ${primeiro}!`);
    setMensagem(ev.mensagem); setVersiculo(vers);
    setImagemBg(''); setCardUrl(''); setErro('');
  };

  const selecionarData = (d: DataCom & { data: Date }) => {
    const dataFmt = d.data.toLocaleDateString('pt-BR', { day:'2-digit', month:'long' });
    const ev: EventoSelecionado = {
      tipo: 'data', nome: d.label,
      descricao: d.descricao, subtitulo: `${d.icone} ${dataFmt}`,
      mensagem: d.descricao + '. Que Deus abençoe e honre cada um que se dedica a esse chamado!',
      versiculo: d.versiculo,
    };
    setEvento(ev); setTitulo(`${d.icone} ${d.label}`);
    setMensagem(ev.mensagem); setVersiculo(d.versiculo);
    setImagemBg(''); setCardUrl(''); setErro('');
  };

  const handleGerar = async () => {
    if (!evento) return;
    setGerando(true); setErro(''); setImagemBg(''); setCardUrl('');
    try {
      const body = evento.tipo === 'aniversario'
        ? { tipo: 'aniversario', nome: evento.nome, tema: estilo }
        : { tipo: 'efemeride', descricao: `${evento.nome} — ${evento.descricao}`, tema: estilo };
      const res = await fetchWithAuth('/api/admin/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      setImagemBg(data.url);
      // Auto-compor cartão
      setCompondo(true);
      const card = await composeCard(data.url, titulo, mensagem, versiculo);
      setCardUrl(card);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setGerando(false); setCompondo(false);
    }
  };

  const handleRecompor = async () => {
    if (!imagemBg) return;
    setCompondo(true);
    const card = await composeCard(imagemBg, titulo, mensagem, versiculo);
    setCardUrl(card); setCompondo(false); setEditando(false);
  };

  const whatsappMsg = encodeURIComponent(`${titulo}\n\n${mensagem}\n\n${versiculo}`);
  const isHoje = (d: Date) => d.toDateString() === new Date().toDateString();
  const amanha = new Date(); amanha.setDate(new Date().getDate()+1);
  const isAmanha = (d: Date) => d.toDateString() === amanha.toDateString();
  const dayLabel = (d: Date) => isHoje(d) ? '🎉 Hoje!' : isAmanha(d) ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerador de Cartões</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Próximos 14 dias — aniversários e datas especiais</p>
        </div>
      </div>

      {/* Eventos */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Próximos eventos</span>
          <span className="ml-auto text-xs text-gray-400">Selecione para gerar o cartão</span>
        </div>
        {/* Aniversariantes */}
        {loadingAniv ? (
          <div className="px-4 py-4 text-sm text-gray-400">Carregando...</div>
        ) : aniversariantes.length > 0 ? (
          <div className="p-3 space-y-1.5 border-b border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Aniversariantes</p>
            {aniversariantes.map(p => {
              const [,mes,dia] = p.date_of_birth.split('-').map(Number);
              const dt = new Date(new Date().getFullYear(), mes-1, dia);
              if (dt < new Date()) dt.setFullYear(dt.getFullYear()+1);
              const sel = evento?.tipo === 'aniversario' && evento.nome === p.full_name;
              return (
                <button key={p.id} onClick={() => selecionarAniversariante(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${sel ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-violet-300'}`}>
                  <span className="text-xl">🎂</span>
                  <p className={`flex-1 text-sm font-medium truncate ${sel ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-100'}`}>{p.full_name}</p>
                  <span className={`text-xs font-semibold flex-shrink-0 ${isHoje(dt) ? 'text-red-500' : 'text-gray-400'}`}>{dayLabel(dt)}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        {/* Datas comemorativas */}
        <div className="p-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Datas comemorativas</p>
          {datasProximas.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-2">Nenhuma data especial nos próximos 14 dias.</p>
          ) : datasProximas.map(d => {
            const sel = evento?.tipo === 'data' && evento.nome === d.label;
            return (
              <button key={d.label} onClick={() => selecionarData(d)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${sel ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-violet-300'}`}>
                <span className="text-xl">{d.icone}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${sel ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-100'}`}>{d.label}</p>
                  <p className="text-xs text-gray-400 truncate">{d.descricao}</p>
                </div>
                <span className={`text-xs font-semibold flex-shrink-0 ${isHoje(d.data) ? 'text-red-500' : 'text-gray-400'}`}>{dayLabel(d.data)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel de geração */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Gerar cartão</span>
        </div>
        <div className="p-4 space-y-4">
          {evento ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200 truncate">{evento.nome}</p>
                {evento.subtitulo && <p className="text-xs text-violet-600 dark:text-violet-400">{evento.subtitulo}</p>}
              </div>
              <button onClick={() => { setEvento(null); setImagemBg(''); setCardUrl(''); }} className="text-violet-400 hover:text-violet-600 text-xl leading-none">×</button>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-dashed border-gray-300 dark:border-slate-600 text-center text-sm text-gray-400">
              ← Selecione um evento acima
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estilo visual</label>
            <select value={estilo} onChange={e => setEstilo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
              {ESTILOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          {erro && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{erro}</p>}
          <button onClick={handleGerar} disabled={gerando || !evento}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors">
            {gerando ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar imagem com IA</>}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {(imagemBg || compondo) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cartão gerado</p>
          {compondo ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Compondo cartão...
            </div>
          ) : cardUrl ? (
            <img src={cardUrl} alt="Cartão" className="w-full rounded-xl shadow-md" />
          ) : null}

          {/* Editar textos */}
          {imagemBg && !compondo && (
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <button onClick={() => setEditando(!editando)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Edit3 className="w-4 h-4" />
                {editando ? 'Fechar editor de texto' : 'Editar textos do cartão'}
              </button>
              {editando && (
                <div className="p-4 space-y-3 border-t border-gray-200 dark:border-slate-600">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mensagem</label>
                    <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Versículo bíblico</label>
                    <input value={versiculo} onChange={e => setVersiculo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <button onClick={handleRecompor}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                    <Check className="w-4 h-4" /> Atualizar cartão
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">No celular, pressione a imagem por alguns segundos para salvar.</p>
          {cardUrl && (
            <div className="grid grid-cols-2 gap-3">
              <a href={cardUrl} download="cartao-agentbot.png"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Download className="w-4 h-4" /> Baixar cartão
              </a>
              <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium text-white transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          )}
          <button onClick={() => { setImagemBg(''); setCardUrl(''); setEvento(null); }}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Novo cartão
          </button>
        </div>
      )}
    </div>
  );
}
