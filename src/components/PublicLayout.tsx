import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BookOpen, Flame, Home, UserPlus, Megaphone, X } from 'lucide-react';

interface Church {
  id: string;
  name: string;
  slug: string;
}

interface Ad {
  id: string;
  empresa: string;
  mensagem: string;
  contato: string | null;
}

interface PublicLayoutProps {
  slug: string;
  children: React.ReactNode;
}

export function PublicLayout({ slug, children }: PublicLayoutProps) {
  const router = useRouter();
  const [church, setChurch] = useState<Church | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [adDismissed, setAdDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/public/church/' + slug)
      .then(r => r.json())
      .then(d => {
        if (d.church) {
          setChurch(d.church);
          // Busca banner usando o church_id
          return fetch('/api/public/banner-ad?church_id=' + d.church.id);
        }
      })
      .then(r => r?.json())
      .then(d => { if (d?.ad) setAd(d.ad); })
      .catch(() => {});

    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sheepcare_pub_banner_' + slug)) {
      setAdDismissed(true);
    }
  }, [slug]);

  const dismissAd = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('sheepcare_pub_banner_' + slug, '1');
    }
    setAdDismissed(false);
    setAd(null);
  };

  const base = '/i/' + slug;
  const active = (path: string) =>
    router.asPath === path
      ? 'text-primary-600 dark:text-primary-400 font-semibold border-b-2 border-primary-500'
      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo + nome da igreja */}
          <Link href={base} className="flex items-center gap-2 min-w-0">
            <span className="text-primary-600 font-black text-lg tracking-tight flex-shrink-0">SheepCare</span>
            {church && (
              <>
                <span className="text-gray-300 dark:text-slate-600 flex-shrink-0">|</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{church.name}</span>
              </>
            )}
          </Link>

          {/* CTA cadastro */}
          <Link
            href={'/cadastro?slug=' + slug}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Cadastrar-se
          </Link>
        </div>

        {/* Nav */}
        <nav className="max-w-3xl mx-auto px-4 flex gap-6 text-sm pb-0 overflow-x-auto">
          <Link href={base} className={'flex items-center gap-1.5 py-2.5 ' + active(base)}>
            <Home className="w-3.5 h-3.5" />
            Início
          </Link>
          <Link href={base + '/biblia'} className={'flex items-center gap-1.5 py-2.5 ' + active(base + '/biblia')}>
            <BookOpen className="w-3.5 h-3.5" />
            Bíblia
          </Link>
          <Link href={base + '/devocionais'} className={'flex items-center gap-1.5 py-2.5 ' + active(base + '/devocionais')}>
            <Flame className="w-3.5 h-3.5" />
            Devocionais
          </Link>
        </nav>
      </header>

      {/* Banner de anúncio */}
      {ad && !adDismissed && (
        <div className="max-w-3xl mx-auto w-full px-4 pt-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
            <div className="flex-shrink-0 mt-0.5 w-7 h-7 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Anuncio</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{ad.empresa}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">{ad.mensagem}</p>
              {ad.contato && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ad.contato}</p>}
            </div>
            <button onClick={dismissAd} className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-6 border-t border-gray-100 dark:border-slate-800">
        Desenvolvido com SheepCare &middot; Gestão para igrejas
      </footer>
    </div>
  );
}
