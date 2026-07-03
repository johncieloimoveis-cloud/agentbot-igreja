import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const MENSAGENS = [
  'Bé! Tudo bem por aqui? 😊',
  'Não te esqueças das ovelhas perdidas! 🐑',
  'Você está cuidando bem do rebanho!',
  'Tem alguém que precisa de uma visita hoje?',
  'O bom pastor conhece cada ovelha pelo nome.',
  'Pequenos gestos fazem grande diferença!',
  'Bé bé! Continue o bom trabalho! ✨',
  'Que tal registrar um novo evento na agenda?',
  'Tem aniversariante essa semana? 🎂',
  'Cada pessoa importa no rebanho!',
  'Lembra de atualizar os dados do grupo!',
  'Bé! Já conferiu as novidades do dashboard?',
];

function SheepSVG() {
  return (
    <svg width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Lã — corpo principal */}
      <circle cx="50" cy="48" r="24" fill="white" stroke="#e0e0e0" strokeWidth="1" />
      <circle cx="32" cy="46" r="16" fill="white" stroke="#e0e0e0" strokeWidth="1" />
      <circle cx="68" cy="46" r="16" fill="white" stroke="#e0e0e0" strokeWidth="1" />
      <circle cx="38" cy="34" r="15" fill="white" stroke="#e0e0e0" strokeWidth="1" />
      <circle cx="62" cy="34" r="15" fill="white" stroke="#e0e0e0" strokeWidth="1" />
      <circle cx="50" cy="30" r="16" fill="white" stroke="#e0e0e0" strokeWidth="1" />

      {/* Cabeça */}
      <ellipse cx="50" cy="65" rx="13" ry="11" fill="#4b4b4b" />

      {/* Orelhas */}
      <ellipse cx="38" cy="61" rx="5" ry="3" fill="#4b4b4b" transform="rotate(-30 38 61)" />
      <ellipse cx="62" cy="61" rx="5" ry="3" fill="#4b4b4b" transform="rotate(30 62 61)" />

      {/* Olhos */}
      <ellipse cx="45" cy="63" rx="3" ry="3.5" fill="white" />
      <ellipse cx="55" cy="63" rx="3" ry="3.5" fill="white" />
      <circle cx="45.5" cy="63.5" r="1.5" fill="#222" />
      <circle cx="55.5" cy="63.5" r="1.5" fill="#222" />
      {/* Brilho nos olhos */}
      <circle cx="46" cy="62.5" r="0.6" fill="white" />
      <circle cx="56" cy="62.5" r="0.6" fill="white" />

      {/* Nariz */}
      <ellipse cx="50" cy="69" rx="3.5" ry="2" fill="#f9a8a8" />

      {/* Sorriso */}
      <path d="M46 72 Q50 75 54 72" stroke="#ccc" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Pernas */}
      <rect x="36" y="74" width="7" height="14" rx="3.5" fill="#4b4b4b" />
      <rect x="57" y="74" width="7" height="14" rx="3.5" fill="#4b4b4b" />

      {/* Cascos */}
      <rect x="36" y="84" width="7" height="5" rx="2" fill="#333" />
      <rect x="57" y="84" width="7" height="5" rx="2" fill="#333" />
    </svg>
  );
}

export function Mascote() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, 500);
  }, []);

  const mostrar = useCallback(() => {
    const msg = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];
    setMensagem(msg);
    setLeaving(false);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 9000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  useEffect(() => {
    // Primeira aparição: 40 segundos após carregar
    const first = setTimeout(mostrar, 40000);

    // Depois: a cada 4–7 minutos aleatoriamente
    let interval: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = Math.random() * 180000 + 240000; // 4–7 min
      interval = setTimeout(() => {
        mostrar();
        schedule();
      }, delay);
    };
    const kickoff = setTimeout(schedule, 40000);

    return () => {
      clearTimeout(first);
      clearTimeout(kickoff);
      clearTimeout(interval);
    };
  }, [mostrar]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-500 ${
        leaving ? 'translate-y-40 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Balão de fala */}
      <div className="relative bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-2xl px-4 py-3 shadow-xl text-sm max-w-[210px] mr-3">
        <button
          onClick={dismiss}
          className="absolute -top-2 -right-2 bg-gray-200 dark:bg-slate-500 hover:bg-gray-300 dark:hover:bg-slate-400 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
        {mensagem}
        {/* Seta do balão */}
        <div className="absolute -bottom-2 right-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-white dark:border-t-slate-700" />
      </div>

      {/* Ovelha */}
      <div
        onClick={dismiss}
        className="cursor-pointer drop-shadow-lg"
        style={{ animation: 'sheepBounce 2s ease-in-out infinite' }}
      >
        <SheepSVG />
      </div>

      <style>{`
        @keyframes sheepBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
