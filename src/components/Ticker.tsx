import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

interface Anuncio {
  id: string;
  empresa: string;
  mensagem: string;
}

export function Ticker() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    supabase
      .from('anuncios')
      .select('id, empresa, mensagem')
      .eq('status', 'ativo')
      .then(({ data }) => setAnuncios(data || []));
  }, []);

  if (anuncios.length === 0) return null;

  // Duplica para loop contínuo sem salto
  const items = [...anuncios, ...anuncios, ...anuncios];
  const duracao = Math.max(20, anuncios.length * 8); // velocidade proporcional à qtd

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-8 bg-slate-950 border-t border-slate-700 flex items-center overflow-hidden select-none z-40"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Label fixo */}
      <div className="flex-shrink-0 px-3 bg-primary-600 h-full flex items-center">
        <span className="text-white text-xs font-bold tracking-widest uppercase">Publicidade</span>
      </div>

      {/* Faixa rolante */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="inline-flex items-center whitespace-nowrap"
          style={{
            animation: `ticker ${duracao}s linear infinite`,
            animationPlayState: pausado ? 'paused' : 'running',
          }}
        >
          {items.map((a, i) => (
            <span key={`${a.id}-${i}`} className="inline-flex items-center gap-2 px-6 text-xs text-gray-300">
              <span className="text-primary-400 font-semibold">🏪 {a.empresa}</span>
              <span className="text-gray-500">—</span>
              <span>{a.mensagem}</span>
              <span className="text-gray-600 ml-4">◆</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
