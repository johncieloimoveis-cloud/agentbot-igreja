import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';

interface Ad {
  id: string;
  empresa: string;
  mensagem: string;
  contato: string | null;
}

export function BannerAd() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Não exibe se já foi fechado nesta sessão
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sheepcare_banner_dismissed')) {
      setDismissed(true);
      return;
    }

    fetch('/api/public/banner-ad')
      .then(r => r.json())
      .then(data => {
        if (data?.ad) setAd(data.ad);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('sheepcare_banner_dismissed', '1');
    }
    setDismissed(true);
  };

  if (dismissed || !ad) return null;

  return (
    <div className="mx-6 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
      {/* Ícone */}
      <div className="flex-shrink-0 mt-0.5 w-7 h-7 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
        <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
            Anúncio
          </span>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">
            {ad.empresa}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">
          {ad.mensagem}
        </p>
        {ad.contato && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            📞 {ad.contato}
          </p>
        )}
      </div>

      {/* Fechar */}
      <button
        onClick={dismiss}
        title="Fechar anúncio"
        className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
