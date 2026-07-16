import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BookOpen, Flame, Home, UserPlus, Megaphone, X, Instagram, Facebook, Youtube, Globe, Phone } from 'lucide-react';

interface Church {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  city?: string | null;
  pastor?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  website?: string | null;
  whatsapp?: string | null;
}

interface Ad {
  id: string;
  empresa: string;
  mensagem: string;
  contato: string | null;
}

interface Anuncio {
  id: string;
  empresa: string;
  mensagem: string;
}

interface PublicLayoutProps {
  slug: string;
  children: React.ReactNode;
}

function PublicTicker({ anuncios }: { anuncios: Anuncio[] }) {
  const [pausado, setPausado] = useState(false);
  if (anuncios.length === 0) return null;
  const items = [...anuncios, ...anuncios, ...anuncios];
  const duracao = Math.max(20, anuncios.length * 8);
  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-8 bg-slate-950 border-t border-slate-700 flex items-center overflow-hidden select-none z-40"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="flex-shrink-0 px-3 bg-primary-600 h-full flex items-center">
        <span className="text-white text-xs font-bold tracking-widest uppercase">Publicidade</span>
      </div>
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
              <span className="text-primary-400 font-semibold">&#128;{a.empresa}</span>
              <span className="text-gray-500">&#8212;</span>
              <span>{a.mensagem}</span>
              <span className="text-gray-600 ml-4">&#9670;</span>
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

export function PublicLayout({ slug, children }: PublicLayoutProps) {
  const router = useRouter();
  const [church, setChurch] = useState<Church | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [adDismissed, setAdDismissed] = useState(false);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    // CORRIGIDO: endpoint correto church-by-slug?slug=
    fetch('/api/public/church-by-slug?slug=' + slug)
      .then(r => r.json())
      .then(d => {
        if (d.church) {
          setChurch(d.church);
          const cid = d.church.id;
          // Banner principal
          fetch('/api/public/banner-ad?church_id=' + cid)
            .then(r => r.json())
            .then(d2 => { if (d2?.ad) setAd(d2.ad); })
            .catch(() => {});
          // Ticker de anuncios
          fetch('/api/public/ticker-ads?church_id=' + cid)
            .then(r => r.json())
            .then(d3 => { if (d3?.anuncios) setAnuncios(d3.anuncios); })
            .catch(() => {});
        }
      })
      .catch(() => {});

    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('agentbot_pub_banner_' + slug)) {
      setAdDismissed(true);
    }
  }, [slug]);

  const dismissAd = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('agentbot_pub_banner_' + slug, '1');
    }
    setAdDismissed(false);
    setAd(null);
  };

  const base = '/i/' + slug;
  const active = (path: string) =>
    router.asPath === path
      ? 'text-primary-600 dark:text-primary-400 font-semibold border-b-2 border-primary-500'
      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400';

  const hasSocial = church && (church.instagram || church.facebook || church.youtube || church.website || church.whatsapp);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={base} className="flex items-center gap-2 min-w-0">
            {church?.logo_url ? (
              <img
                src={church.logo_url}
                alt={church.name}
                className="w-8 h-8 rounded-lg object-contain flex-shrink-0 bg-white"
              />
            ) : (
              <span className="text-primary-600 font-black text-lg tracking-tight flex-shrink-0">AgentBot Igreja</span>
            )}
            {church && (
              <>
                {church.logo_url && <span className="text-gray-300 dark:text-slate-600 flex-shrink-0">|</span>}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{church.name}</span>
              </>
            )}
          </Link>
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
            In&iacute;cio
          </Link>
          <Link href={base + '/biblia'} className={'flex items-center gap-1.5 py-2.5 ' + active(base + '/biblia')}>
            <BookOpen className="w-3.5 h-3.5" />
            B&iacute;blia
          </Link>
          <Link href={base + '/devocionais'} className={'flex items-center gap-1.5 py-2.5 ' + active(base + '/devocionais')}>
            <Flame className="w-3.5 h-3.5" />
            Devocionais
          </Link>
        </nav>
      </header>

      {/* Banner de anuncio */}
      {ad && !adDismissed && (
        <div className="max-w-3xl mx-auto w-full px-4 pt-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
            <div className="flex-shrink-0 mt-0.5 w-7 h-7 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">An&uacute;ncio</span>
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

      {/* Conteudo */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-12">
        {children}
      </main>

      {/* Links sociais da igreja */}
      {hasSocial && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Siga a igreja</p>
            <div className="flex flex-wrap gap-3">
              {church?.instagram && (
                <a
                  href={'https://instagram.com/' + church.instagram.replace('@', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium hover:shadow-sm transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  {church.instagram.startsWith('@') ? church.instagram : '@' + church.instagram}
                </a>
              )}
              {church?.facebook && (
                <a
                  href={church.facebook.startsWith('http') ? church.facebook : 'https://facebook.com/' + church.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium hover:shadow-sm transition-all"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
              )}
              {church?.youtube && (
                <a
                  href={church.youtube.startsWith('http') ? church.youtube : 'https://youtube.com/@' + church.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium hover:shadow-sm transition-all"
                >
                  <Youtube className="w-4 h-4" />
                  YouTube
                </a>
              )}
              {church?.website && (
                <a
                  href={church.website.startsWith('http') ? church.website : 'https://' + church.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:shadow-sm transition-all"
                >
                  <Globe className="w-4 h-4" />
                  Site
                </a>
              )}
              {church?.whatsapp && (
                <a
                  href={'https://wa.me/55' + church.whatsapp.replace(/\D/g, '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-300 rounded-xl text-sm font-medium hover:shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-6 pb-10 border-t border-gray-100 dark:border-slate-800">
        Desenvolvido com AgentBot Igreja &middot; Gest&atilde;o para igrejas
      </footer>

      {/* Ticker de anuncios (fixo no rodape) */}
      <PublicTicker anuncios={anuncios} />
    </div>
  );
}
