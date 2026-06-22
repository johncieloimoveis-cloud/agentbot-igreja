import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import {
  getPeopleStats,
  getGroupsStats,
  getMinistriesStats,
  getUpcomingBirthdays,
  getRecentVisitors,
  getAverageAttendance,
  getAbsentPeople,
} from '@/services/dashboard';
import { LogOut, Users, Users2, UserCheck, Calendar, TrendingUp, Cake, Heart, Sparkles, MessageCircle } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [dashLoading, setDashLoading] = useState(false);
  const [stats, setStats] = useState<{
    people: any;
    groups: any;
    ministries: any;
    birthdays: any[];
    recentVisitors: any[];
    attendance: any;
    absentPeople: any[];
  }>({
    people: { total: 0, active_member: 0, visitor: 0, new_convert: 0, in_discipleship: 0, absent: 0, leader: 0 },
    groups: { total: 0 },
    ministries: { total: 0 },
    birthdays: [],
    recentVisitors: [],
    attendance: { total_events: 0, average: 0 },
    absentPeople: [],
  });

  // IA state: { [personId]: 'loading' | 'done' | undefined }
  const [aiState, setAiState] = useState<Record<string, 'loading' | 'done'>>({});

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setDashLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const [peopleRes, groupsRes, ministriesRes, birthdaysRes, visitorsRes, attendanceRes, absentRes] =
        await Promise.all([
          getPeopleStats(churchId),
          getGroupsStats(churchId),
          getMinistriesStats(churchId),
          getUpcomingBirthdays(churchId, 7),
          getRecentVisitors(churchId, 30),
          getAverageAttendance(churchId),
          getAbsentPeople(churchId, 10),
        ]);
      setStats({
        people: peopleRes.data || stats.people,
        groups: groupsRes.data || stats.groups,
        ministries: ministriesRes.data || stats.ministries,
        birthdays: birthdaysRes.data || [],
        recentVisitors: visitorsRes.data || [],
        attendance: attendanceRes.data || stats.attendance,
        absentPeople: absentRes.data || [],
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setDashLoading(false);
    }
  };

  const handleGenerateAndSend = async (
    person: any,
    messageType: 'aniversario' | 'resgate'
  ) => {
    setAiState((prev) => ({ ...prev, [person.id]: 'loading' }));
    try {
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType,
          personName: person.full_name.split(' ')[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const phone = (person.whatsapp || person.phone || '').replace(/\D/g, '');
      const encoded = encodeURIComponent(data.message);
      if (phone) {
        window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
      }
      setAiState((prev) => ({ ...prev, [person.id]: 'done' }));
    } catch (err) {
      console.error('Erro IA:', err);
      setAiState((prev) => {
        const next = { ...prev };
        delete next[person.id];
        return next;
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-950 dark:text-white mt-2">{value}</p>
        </div>
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
    </div>
  );

  const AiPersonCard = ({ person, messageType, color }: { person: any; messageType: 'aniversario' | 'resgate'; color: string }) => {
    const state = aiState[person.id];
    return (
      <div className={`flex justify-between items-center p-3 ${color} rounded`}>
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{person.full_name}</p>
          {person.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{person.phone}</p>}
        </div>
        <button
          onClick={() => handleGenerateAndSend(person, messageType)}
          disabled={state === 'loading'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            state === 'done'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white'
          }`}
        >
          {state === 'loading' ? (
            <>
              <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Gerando...
            </>
          ) : state === 'done' ? (
            <>
              <MessageCircle className="w-3 h-3" />
              Enviado
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Mensagem IA
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/lobot-logo.svg" alt="AgentBot Igreja" className="w-12 h-12 rounded-lg shadow-sm" />
            <h1 className="text-2xl font-bold text-gray-950 dark:text-white">AgentBot Igreja</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Dashboard 📊</h2>
          <p className="text-gray-600 dark:text-gray-400">Visão geral da sua igreja</p>
        </div>

        {dashLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total de Pessoas" value={stats.people.total} color="border-blue-500" />
              <StatCard icon={UserCheck} label="Membros Ativos" value={stats.people.active_member} color="border-green-500" />
              <StatCard icon={Users2} label="Visitantes" value={stats.people.visitor} color="border-yellow-500" />
              <StatCard icon={TrendingUp} label="Novos Convertidos" value={stats.people.new_convert} color="border-purple-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard icon={Calendar} label="Em Discipulado" value={stats.people.in_discipleship} color="border-indigo-500" />
              <StatCard icon={Heart} label="Grupos" value={stats.groups.total} color="border-pink-500" />
              <StatCard icon={Users} label="Ministérios" value={stats.ministries.total} color="border-orange-500" />
            </div>

            {/* Painel IA Pastoral */}
            {(stats.birthdays.length > 0 || stats.absentPeople.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white">Ações Pastorais com IA</h3>
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
                    Clique para gerar e abrir WhatsApp
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Aniversariantes */}
                  {stats.birthdays.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-t-4 border-red-400">
                      <div className="flex items-center gap-2 mb-4">
                        <Cake className="w-5 h-5 text-red-500" />
                        <h4 className="font-bold text-gray-900 dark:text-white">Aniversariantes (7 dias)</h4>
                        <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{stats.birthdays.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stats.birthdays.map((person: any) => (
                          <AiPersonCard key={person.id} person={person} messageType="aniversario" color="bg-red-50 dark:bg-red-900/10" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ausentes */}
                  {stats.absentPeople.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-t-4 border-amber-400">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-amber-500" />
                        <h4 className="font-bold text-gray-900 dark:text-white">Afastados</h4>
                        <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{stats.absentPeople.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stats.absentPeople.map((person: any) => (
                          <AiPersonCard key={person.id} person={person} messageType="resgate" color="bg-amber-50 dark:bg-amber-900/10" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Aniversariantes (lista simples quando sem IA panel) */}
              {stats.birthdays.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Cake className="w-6 h-6 text-red-500" />
                    <h3 className="text-lg font-bold text-gray-950 dark:text-white">Aniversariantes (7 dias)</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Nenhum aniversariante</p>
                </div>
              )}

              {/* Visitantes Recentes */}
              <div className={`bg-white dark:bg-slate-800 rounded-lg shadow p-6 ${stats.birthdays.length === 0 ? '' : 'lg:col-span-2'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-bold text-gray-950 dark:text-white">Visitantes Recentes (30 dias)</h3>
                </div>
                {stats.recentVisitors.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Nenhum visitante recente</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentVisitors.slice(0, 5).map((visitor: any) => (
                      <div key={visitor.id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="font-medium text-gray-950 dark:text-white text-sm">{visitor.full_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(visitor.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                    {stats.recentVisitors.length > 5 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
                        +{stats.recentVisitors.length - 5} outros
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-6">Resumo da Igreja</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-950 dark:text-white">{stats.people.absent}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Afastados</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-950 dark:text-white">{stats.people.leader}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Líderes</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-950 dark:text-white">{stats.attendance.total_events}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Eventos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-950 dark:text-white">{stats.attendance.average}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Frequência Média</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
