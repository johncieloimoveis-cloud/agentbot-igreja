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
} from '@/services/dashboard';
import { LogOut, Users, Users2, UserCheck, Calendar, TrendingUp, Cake, Heart } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [dashLoading, setDashLoading] = useState(false);

  const [stats, setStats] = useState({
    people: { total: 0, active_member: 0, visitor: 0, new_convert: 0, in_discipleship: 0, absent: 0, leader: 0 },
    groups: { total: 0 },
    ministries: { total: 0 },
    birthdays: [],
    recentVisitors: [],
    attendance: { total_events: 0, average: 0 },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setDashLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

      const [peopleRes, groupsRes, ministriesRes, birthdaysRes, visitorsRes, attendanceRes] =
        await Promise.all([
          getPeopleStats(churchId),
          getGroupsStats(churchId),
          getMinistriesStats(churchId),
          getUpcomingBirthdays(churchId, 7),
          getRecentVisitors(churchId, 30),
          getAverageAttendance(churchId),
        ]);

      setStats({
        people: peopleRes.data || stats.people,
        groups: groupsRes.data || stats.groups,
        ministries: ministriesRes.data || stats.ministries,
        birthdays: birthdaysRes.data || [],
        recentVisitors: visitorsRes.data || [],
        attendance: attendanceRes.data || stats.attendance,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setDashLoading(false);
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

  if (!user) {
    return null;
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{value}</p>
        </div>
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/lobot-logo.svg" alt="AgentBot Igreja" className="w-12 h-12 rounded-lg shadow-sm" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">AgentBot Igreja</h1>
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
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Dashboard 📊</h2>
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
              <StatCard
                icon={Users}
                label="Total de Pessoas"
                value={stats.people.total}
                color="border-blue-500"
              />
              <StatCard
                icon={UserCheck}
                label="Membros Ativos"
                value={stats.people.active_member}
                color="border-green-500"
              />
              <StatCard
                icon={Users2}
                label="Visitantes"
                value={stats.people.visitor}
                color="border-yellow-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Novos Convertidos"
                value={stats.people.new_convert}
                color="border-purple-500"
              />
            </div>

            {/* Segunda linha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon={Calendar}
                label="Em Discipulado"
                value={stats.people.in_discipleship}
                color="border-indigo-500"
              />
              <StatCard
                icon={Heart}
                label="Grupos"
                value={stats.groups.total}
                color="border-pink-500"
              />
              <StatCard
                icon={Users}
                label="Ministérios"
                value={stats.ministries.total}
                color="border-orange-500"
              />
            </div>

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Aniversariantes */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cake className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Aniversariantes (7 dias)</h3>
                </div>
                {stats.birthdays.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Nenhum aniversariante</p>
                ) : (
                  <div className="space-y-2">
                    {stats.birthdays.map((person: any) => (
                      <div key={person.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{person.full_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(person.date_of_birth).toLocaleDateString('pt-BR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visitantes Recentes */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Visitantes Recentes (30 dias)</h3>
                </div>
                {stats.recentVisitors.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Nenhum visitante recente</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentVisitors.slice(0, 5).map((visitor: any) => (
                      <div key={visitor.id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{visitor.full_name}</p>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6">Resumo da Igreja</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.people.absent}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Afastados</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.people.leader}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Líderes</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.attendance.total_events}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Eventos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded">
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.attendance.average}</p>
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
