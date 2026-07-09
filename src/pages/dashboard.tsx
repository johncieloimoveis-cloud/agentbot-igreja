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
import { supabase } from '@/services/supabase';
import { LogOut, Users, Users2, UserCheck, Calendar, TrendingUp, Cake, Heart, Sparkles, X, ClipboardCheck } from 'lucide-react';
import { WhatsAppShare } from '@/components/WhatsAppShare';

interface AiCard {
  personId: string;
  loading: boolean;
  message: string;
  error: string;
}

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
    cadastrosAtualizados: number;
  }>({
    people: { total: 0, active_member: 0, visitor: 0, new_convert: 0, in_discipleship: 0, absent: 0, leader: 0 },
    groups: { total: 0 },
    ministries: { total: 0 },
    birthdays: [],
    recentVisitors: [],
    attendance: { total_events: 0, average: 0 },
    absentPeople: [],
    cadastrosAtualizados: 0,
  });

  // aiCards: mapa personId → estado do card
  const [aiCards, setAiCards] = useState<Record<string, AiCard>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const handleCopy = (personId: string, message: string) => {
    navigator.clipboard.writeText(message);
    setCopied((prev) => ({ ...prev, [personId]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [personId]: false })), 2000);
  };

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
      const [peopleRes, groupsRes, ministriesRes, birthdaysRes, visitorsRes, attendanceRes, absentRes, cadastrosRes] =
        await Promise.all([
          getPeopleStats(churchId),
          getGroupsStats(churchId),
          getMinistriesStats(churchId),
          getUpcomingBirthdays(churchId),
          getRecentVisitors(churchId, 30),
          getAverageAttendance(churchId),
          getAbsentPeople(churchId, 10),
          supabase.from('people').select('*', { count: 'exact', head: true }).not('cadastro_atualizado_em', 'is', null),
        ]);
      setStats({
        people: peopleRes.data || stats.people,
        groups: groupsRes.data || stats.groups,
        ministries: ministriesRes.data || stats.ministries,
        birthdays: birthdaysRes.data || [],
        recentVisitors: visitorsRes.data || [],
        attendance: attendanceRes.data || stats.attendance,
        absentPeople: absentRes.data || [],
        cadastrosAtualizados: cadastrosRes.count || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setDashLoading(false);
    }
  };

  const handleGenerate = async (person: any, messageType: 'aniversario' | 'resgate') => {
    setAiCards((prev) => ({
      ...prev,
      [person.id]: { personId: person.id, loading: true, message: '', error: '' },
    }));
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
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      setAiCards((prev) => ({
        ...prev,
        [person.id]: { personId: person.id, loading: false, message: data.message, error: '' },
      }));
    } catch (err: any) {
      setAiCards((prev) => ({
        ...prev,
        [person.id]: { personId: person.id, loading: false, message: '', error: err.message || 'Erro' },
      }));
    }
  };

  const dismissCard = (personId: string) => {
    setAiCards((prev) => {
      const next = { ...prev };
      delete next[personId];
      return next;
    });
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/login'); } catch (e) { console.error(e); }
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

  const renderAiPersonRow = (person: any, messageType: 'aniversario' | 'resgate', bgColor: string) => {
    const card = aiCards[person.id];
    return (
      <div key={person.id} className={`rounded-lg overflow-hidden border border-transparent ${card?.message ? 'border-violet-200 dark:border-violet-800' : ''}`}>
        <div className={`flex justify-between items-center p-3 ${bgColor}`}>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{person.full_name}</p>
            {person.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{person.phone}</p>}
          </div>
          {!card ? (
            <button
              onClick={() => handleGenerate(person, messageType)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Mensagem IA
            </button>
          ) : card.loading ? (
            <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
              <div className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
              Gerando...
            </div>
          ) : card.error ? (
            <span className="text-xs text-red-500">{card.error}</span>
          ) : null}
        </div>

        {card?.message && (
          <div className="bg-violet-50 dark:bg-violet-900/20 p-3 border-t border-violet-100 dark:border-violet-800">
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{card.message}</p>
            <div className="flex gap-2 flex-wrap">
              <WhatsAppShare
                phone={person.whatsapp || person.phone || ''}
                message={card.message}
                onCopy={() => setCopied((p) => ({ ...p, [person.id]: true }))}
              />
              <button
                onClick={() => handleGenerate(person, messageType)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Regerar
              </button>
              <button
                onClick={() => dismissCard(person.id)}
                className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total de Pessoas" value={stats.people.total} color="border-blue-500" />
              <StatCard icon={UserCheck} label="Membros Ativos" value={stats.people.active_member} color="border-green-500" />
              <StatCard icon={Users2} label="Visitantes" value={stats.people.visitor} color="border-yellow-500" />
              <StatCard icon={TrendingUp} label="Novos Convertidos" value={stats.people.new_convert} color="border-purple-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard icon={Calendar} label="Em Discipulado" value={stats.people.in_discipleship} color="border-indigo-500" />
              <StatCard icon={Heart} label="Grupos" value={stats.groups.total} color="border-pink-500" />
              <StatCard
                icon={ClipboardCheck}
                label="Cadastros Atualizados"
                value={`${stats.cadastrosAtualizados} / ${stats.people.total}`}
                color="border-teal-500"
              />
            </div>

            {/* Painel IA Pastoral */}
            {(stats.birthdays.length > 0 || stats.absentPeople.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white">Ações Pastorais com IA</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stats.birthdays.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-t-4 border-red-400">
                      <div className="flex items-center gap-2 mb-4">
                        <Cake className="w-5 h-5 text-red-500" />
                        <h4 className="font-bold text-gray-900 dark:text-white">Aniversariantes do Mês 🎂</h4>
                        <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{stats.birthdays.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stats.birthdays.map((person: any) => {
                          const isToday = person.days_until === 0;
                          const label = isToday ? '🎉 Hoje!' : person.days_until > 0 ? `em ${person.days_until}d` : `dia ${person.birth_day}`;
                          return (
                            <div key={person.id} className={`rounded-lg overflow-hidden border ${isToday ? 'border-red-400' : 'border-transparent'}`}>
                              <div className={`flex justify-between items-center p-3 ${isToday ? 'bg-red-100 dark:bg-red-900/30' : 'bg-red-50 dark:bg-red-900/10'}`}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{person.full_name}</p>
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isToday ? 'bg-red-500 text-white' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>{label}</span>
                                  </div>
                                  {person.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{person.phone}</p>}
                                </div>
                                {!aiCards[person.id] ? (
                                  <button
                                    onClick={() => handleGenerate(person, 'aniversario')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    Mensagem IA
                                  </button>
                                ) : aiCards[person.id].loading ? (
                                  <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                                    <div className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                                    Gerando...
                                  </div>
                                ) : aiCards[person.id].error ? (
                                  <span className="text-xs text-red-500">{aiCards[person.id].error}</span>
                                ) : null}
                              </div>
                              {aiCards[person.id]?.message && (
                                <div className="bg-violet-50 dark:bg-violet-900/20 p-3 border-t border-violet-100 dark:border-violet-800">
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{aiCards[person.id].message}</p>
                                  <div className="flex gap-2 flex-wrap">
                                    <WhatsAppShare
                                      phone={person.whatsapp || person.phone || ''}
                                      message={aiCards[person.id].message}
                                      onCopy={() => setCopied((p) => ({ ...p, [person.id]: true }))}
                                    />
                                    <button
                                      onClick={() => handleGenerate(person, 'aniversario')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-lg transition-colors"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      Regerar
                                    </button>
                                    <button
                                      onClick={() => dismissCard(person.id)}
                                      className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {stats.absentPeople.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-t-4 border-amber-400">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-amber-500" />
                        <h4 className="font-bold text-gray-900 dark:text-white">Afastados</h4>
                        <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{stats.absentPeople.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stats.absentPeople.map((person: any) =>
                          renderAiPersonRow(person, 'resgate', 'bg-amber-50 dark:bg-amber-900/10')
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {stats.birthdays.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Cake className="w-6 h-6 text-red-500" />
                    <h3 className="text-lg font-bold text-gray-950 dark:text-white">Aniversariantes (7 dias)</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Nenhum aniversariante</p>
                </div>
              )}
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
                        <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(visitor.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ))}
                    {stats.recentVisitors.length > 5 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">+{stats.recentVisitors.length - 5} outros</p>
                    )}
                  </div>
                )}
              </div>
            </div>

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
