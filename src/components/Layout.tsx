import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Mascote } from '@/components/Mascote';
import { Ticker } from '@/components/Ticker';
import { BannerAd } from '@/components/BannerAd';
import { UserRole } from '@/context/AuthContext';
import {
  LogOut,
  Menu,
  X,
  Home,
  Users,
  Users2,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const ALL_ROLES: UserRole[] = ['Arcanjo', 'Querubim', 'Serafim', 'Anjinho'];
const GESTAO: UserRole[] = ['Arcanjo', 'Querubim'];
const LIDERANCA: UserRole[] = ['Arcanjo', 'Querubim', 'Serafim'];

// Rotas e roles mínimos para acesso
const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard':            LIDERANCA,
  '/organogram':           LIDERANCA,
  '/people':               LIDERANCA,
  '/people/new':           GESTAO,
  '/people/mapa':          LIDERANCA,
  '/people/geocodificar':  GESTAO,
  '/groups':               ALL_ROLES,
  '/groups/mapa':          LIDERANCA,
  '/groups/new':           GESTAO,
  '/agenda':               LIDERANCA,
  '/agenda/new':           LIDERANCA,
  '/estudo':               ALL_ROLES,
  '/estudo/biblia':        ALL_ROLES,
  '/estudo/plano-leitura': ALL_ROLES,
  '/estudo/anotacoes':     ALL_ROLES,
  '/estudo/devocionais':   ALL_ROLES,
  '/estudo/analise-letra': ALL_ROLES,
  '/estudo/quiz-biblico':  ALL_ROLES,
  '/users':                GESTAO,
  '/admin/anuncios':       ['Arcanjo'],
  '/admin/planos':         ['Arcanjo'],
  '/admin/cadastros':      GESTAO,
};

function getAllowedRoles(pathname: string): UserRole[] {
  if (ROUTE_ROLES[pathname]) return ROUTE_ROLES[pathname];
  const prefix = Object.keys(ROUTE_ROLES)
    .filter((k) => pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? ROUTE_ROLES[prefix] : ['Arcanjo'];
}

const ROLE_BADGE: Record<UserRole, string> = {
  Arcanjo:  '👑 Arcanjo',
  Querubim: '✨ Querubim',
  Serafim:  '⭐ Serafim',
  Anjinho:  '😇 Anjinho',
};

interface SubItem {
  label: string;
  href: string;
  allowedRoles: UserRole[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  allowedRoles: UserRole[];
  submenu: SubItem[];
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Guarda de rota: redireciona se o role não tem acesso
  useEffect(() => {
    if (!role) return;
    const allowed = getAllowedRoles(router.pathname);
    if (!allowed.includes(role)) {
      // Anjinho só acessa grupos — redireciona para lá
      const fallback = role === 'Anjinho' ? '/groups' : '/dashboard';
      router.replace(fallback);
    }
  }, [router.pathname, role]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('sheepcare_banner_dismissed');
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: '📊 Dashboard',
      icon: Home,
      href: '/dashboard',
      allowedRoles: LIDERANCA,
      submenu: [],
    },
    {
      id: 'organogram',
      label: '🏛️ Organograma',
      icon: Users,
      href: '/organogram',
      allowedRoles: LIDERANCA,
      submenu: [],
    },
    {
      id: 'people',
      label: '👤 Pessoas',
      icon: Users,
      href: '/people',
      allowedRoles: LIDERANCA,
      submenu: [
        { label: 'Todas as Pessoas', href: '/people',       allowedRoles: LIDERANCA },
        { label: 'Nova Pessoa',       href: '/people/new',  allowedRoles: GESTAO },
        { label: '🗺️ Mapa',          href: '/people/mapa',          allowedRoles: LIDERANCA },
        { label: '📍 Geocodificar',   href: '/people/geocodificar',  allowedRoles: GESTAO },
      ],
    },
    {
      id: 'groups',
      label: '👫 Grupos',
      icon: Users2,
      href: '/groups',
      allowedRoles: ALL_ROLES,
      submenu: [
        { label: 'Todos os Grupos', href: '/groups',      allowedRoles: ALL_ROLES },
        { label: 'Novo Grupo',       href: '/groups/new', allowedRoles: GESTAO },
        { label: '🗺️ Mapa',         href: '/groups/mapa', allowedRoles: LIDERANCA },
      ],
    },
    {
      id: 'agenda',
      label: '🗓 Agenda',
      icon: Calendar,
      href: '/agenda',
      allowedRoles: LIDERANCA,
      submenu: [
        { label: 'Calendário',  href: '/agenda',     allowedRoles: LIDERANCA },
        { label: 'Novo Evento', href: '/agenda/new', allowedRoles: LIDERANCA },
      ],
    },
    {
      id: 'estudo',
      label: '📖 Estudo',
      icon: BookOpen,
      href: '/estudo',
      allowedRoles: ALL_ROLES,
      submenu: [
        { label: 'Bíblia',             href: '/estudo/biblia',         allowedRoles: ALL_ROLES },
        { label: 'Plano de Leitura',  href: '/estudo/plano-leitura',  allowedRoles: ALL_ROLES },
        { label: 'Anotações',         href: '/estudo/anotacoes',      allowedRoles: ALL_ROLES },
        { label: 'Devocionais',       href: '/estudo/devocionais',    allowedRoles: ALL_ROLES },
        { label: '🎵 Análise de Letra', href: '/estudo/analise-letra',  allowedRoles: ALL_ROLES },
        { label: '❓ Quiz Bíblico',    href: '/estudo/quiz-biblico',   allowedRoles: ALL_ROLES },
      ],
    },
    {
      id: 'users',
      label: '👥 Usuários',
      icon: Users,
      href: '/users',
      allowedRoles: GESTAO,
      submenu: [
        { label: 'Gestão de Usuários', href: '/users', allowedRoles: GESTAO },
      ],
    },
    {
      id: 'admin',
      label: '⚙️ Admin',
      icon: Users,
      href: '/admin',
      allowedRoles: GESTAO,
      submenu: [
        { label: 'Anúncios', href: '/admin/anuncios', allowedRoles: ['Arcanjo'] },
        { label: 'Planos',   href: '/admin/planos',   allowedRoles: ['Arcanjo'] },
        { label: 'Cadastros',     href: '/admin/cadastros',     allowedRoles: GESTAO },
        { label: 'Configurações', href: '/admin/configuracoes', allowedRoles: ['Arcanjo'] },
      ],
    },
  ];

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + '/');

  const visibleMenuItems = menuItems.filter(
    (item) => !role || item.allowedRoles.includes(role)
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 shadow-sm transition-all duration-300 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <img
                src="/lobot-logo.svg"
                alt="AgentBot Igreja"
                className="w-10 h-10 flex-shrink-0 rounded-full"
              />
              <h1
                className={`font-bold text-primary-600 dark:text-primary-400 text-xs ${!sidebarOpen && 'hidden'}`}
              >
                AgentBot Igreja
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white dark:hover:text-gray-200 p-1"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Badge do role */}
        {sidebarOpen && role && (
          <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              {ROLE_BADGE[role]}
            </span>
          </div>
        )}

        {/* Itens de menu */}
        <nav className="p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isMenuActive = isActive(item.href);
            const isExpanded = expandedMenu === item.id;

            const visibleSubmenu = item.submenu.filter(
              (sub) => !role || sub.allowedRoles.includes(role)
            );

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (visibleSubmenu.length > 0) {
                      setExpandedMenu(isExpanded ? null : item.id);
                    } else {
                      router.push(item.href);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isMenuActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </div>
                  {sidebarOpen && visibleSubmenu.length > 0 && (
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {sidebarOpen && visibleSubmenu.length > 0 && isExpanded && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-slate-700 pl-4">
                    {visibleSubmenu.map((subitem) => (
                      <button
                        key={subitem.href}
                        onClick={() => router.push(subitem.href)}
                        className={`w-full text-left px-4 py-2 text-sm rounded transition-colors ${
                          isActive(subitem.href)
                            ? 'text-primary-700 dark:text-primary-300 font-semibold bg-primary-50 dark:bg-primary-900/30'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {subitem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
              {visibleMenuItems.find((item) => isActive(item.href))?.label || 'AgentBot Igreja'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <BannerAd />

        <div className="p-6 pb-12">{children}</div>
      </main>

      <Mascote />
      <Ticker />
    </div>
  );
}
