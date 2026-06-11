import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import {
  LogOut,
  Menu,
  X,
  Home,
  Users,
  Users2,
  Calendar,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: '📊 Dashboard',
      icon: Home,
      href: '/dashboard',
      submenu: [],
    },
    {
      id: 'organogram',
      label: '🏛️ Organograma',
      icon: Users,
      href: '/organogram',
      submenu: [],
    },
    {
      id: 'people',
      label: '👤 Pessoas',
      icon: Users,
      href: '/people',
      submenu: [
        { label: 'Todas as Pessoas', href: '/people' },
        { label: 'Nova Pessoa', href: '/people/new' },
      ],
    },
    {
      id: 'groups',
      label: '👫 Grupos',
      icon: Users2,
      href: '/groups',
      submenu: [
        { label: 'Todos os Grupos', href: '/groups' },
        { label: 'Novo Grupo', href: '/groups/new' },
      ],
    },
    {
      id: 'attendance',
      label: '📅 Frequência',
      icon: Calendar,
      href: '/attendance',
      submenu: [
        { label: 'Eventos', href: '/attendance' },
        { label: 'Novo Evento', href: '/attendance/new' },
      ],
    },
    {
      id: 'tasks',
      label: '✅ Tarefas',
      icon: CheckSquare,
      href: '/tasks',
      submenu: [
        { label: 'Minhas Tarefas', href: '/tasks' },
        { label: 'Nova Tarefa', href: '/tasks/new' },
      ],
    },
  ];

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(href + '/');

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
              <img src="/lobot-logo.svg" alt="AgentBot Igreja" className="w-10 h-10 flex-shrink-0 rounded-full" />
              <h1 className={`font-bold text-primary-600 dark:text-primary-400 text-xs ${!sidebarOpen && 'hidden'}`}>
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

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isMenuActive = isActive(item.href);
            const isExpanded = expandedMenu === item.id;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.submenu.length > 0) {
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
                  {sidebarOpen && item.submenu.length > 0 && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Submenu */}
                {sidebarOpen && item.submenu.length > 0 && isExpanded && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-slate-700 pl-4">
                    {item.submenu.map((subitem) => (
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

          {/* Logout Button - Último item do menu */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
              {menuItems.find((item) => isActive(item.href))?.label || 'SheepCare'}
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

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
