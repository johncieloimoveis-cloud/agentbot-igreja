import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { getGroupMembers, updateGroup, deleteGroup, getGroup, addGroupMember, getGroups, getGroupMeetings, addGroupMeeting, updateGroupMeeting, deleteGroupMeeting } from '@/services/groups';
import { getPeople } from '@/services/people';
import { getGroupAttendanceStats, MemberAttendanceStat, Quadrant } from '@/services/attendance';
import { TrashIcon, Plus, Edit2, X, Search, Sparkles, Cake, Users, UserCheck, UserMinus, TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { WhatsAppShare } from '@/components/WhatsAppShare';

interface Person {
  id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  status?: string;
  date_of_birth?: string;
  email?: string;
}

interface Member {
  id: string;
  person: Person;
}

interface GroupMeeting {
  id: string;
  day_of_week: string;
  time?: string;
  event_type?: string;
}

interface Group {
  id: string;
  name: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_address?: string;
  meeting_city?: string;
  lat?: number | null;
  lon?: number | null;
  geocode_status?: string | null;
  parent_group_id?: string;
  leader_id?: string;
  leader?: { id: string; full_name: string } | null;
  host_id?: string;
  host?: { id: string; full_name: string; address?: string; city?: string; lat?: number | null; lon?: number | null } | null;
}

const DAY_LABELS: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terca', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sabado', domingo: 'Domingo',
};

export default function GroupDetail() {
  const router = useRouter();
  const { user, role, church_id } = useAuth();
  const { id } = router.query;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [availablePeople, setAvailablePeople] = useState<any[]>([]);
  const [allChurchPeople, setAllChurchPeople] = useState<any[]>([]);
  const [searchPeople, setSearchPeople] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [parentGroup, setParentGroup] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    meeting_day: '',
    meeting_time: '',
    meeting_address: '',
    meeting_city: '',
    parent_group_id: '',
    leader_id: '',
    host_id: '',
  });

  // Reunioes do grupo
  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [newMeeting, setNewMeeting] = useState({ day_of_week: 'domingo', time: '19:00', event_type: 'gceu' });
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingMeetingData, setEditingMeetingData] = useState({ day_of_week: 'domingo', time: '19:00', event_type: 'gceu' });
  const [addingMeeting, setAddingMeeting] = useState(false);

  // Abas
  const [activeTab, setActiveTab] = useState<'geral' | 'frequencia' | 'membros'>('geral');

  // Frequência
  const [attendanceStats, setAttendanceStats] = useState<MemberAttendanceStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // IA state
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const churchId = church_id || '';
      const { data: groupData, error: groupError } = await getGroup(id as string);
      if (groupError) throw groupError;

      setGroup(groupData);
      setFormData({
        name: groupData?.name || '',
        meeting_day: groupData?.meeting_day || '',
        meeting_time: groupData?.meeting_time || '',
        meeting_address: groupData?.meeting_address || '',
        meeting_city: groupData?.meeting_city || '',
        parent_group_id: groupData?.parent_group_id || '',
        leader_id: groupData?.leader_id || '',
        host_id: groupData?.host_id || '',
      });

      const { data: groupsData } = await getGroups(churchId);
      setAllGroups((groupsData || []).filter((g: any) => g.id !== id));

      if (groupData?.parent_group_id) {
        const { data: parentGroupData } = await getGroup(groupData.parent_group_id);
        setParentGroup(parentGroupData);
      }

      const { data: membersData, error: membersError } = await getGroupMembers(id as string);
      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Carrega todas as pessoas da igreja para o seletor de líder e anfitrião
      const { data: allPeople } = await getPeople(churchId, undefined, undefined);
      setAllChurchPeople(allPeople || []);

      const { data: meetingsData } = await getGroupMeetings(id as string);
      setMeetings(meetingsData || []);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar grupo');
    } finally {
      setLoading(false);
    }
  };

  // --- Frequência ---
  const loadAttendanceStats = async () => {
    if (!id) return;
    setLoadingStats(true);
    try {
      const { data } = await getGroupAttendanceStats(id as string);
      setAttendanceStats(data || []);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'frequencia' && id) loadAttendanceStats();
  }, [activeTab, id]);

  const QUADRANT_CONFIG: Record<Quadrant, { label: string; bg: string; text: string; border: string }> = {
    sumindo:      { label: 'Sumindo',      bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400',    border: 'border-red-300 dark:border-red-700' },
    irregular:    { label: 'Irregular',    bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
    voltando:     { label: 'Voltando',     bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400',   border: 'border-blue-300 dark:border-blue-700' },
    presente:     { label: 'Presente',     bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' },
    sem_historico:{ label: 'Sem histórico',bg: 'bg-gray-100 dark:bg-gray-800',      text: 'text-gray-500 dark:text-gray-400',   border: 'border-gray-200 dark:border-gray-700' },
  };

  const AccIcon = ({ v }: { v: number }) => {
    if (v >= 0.15)  return <TrendingUp  className="w-4 h-4 text-green-500" />;
    if (v <= -0.15) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const renderFrequencyTab = () => {
    if (loadingStats) return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
        Calculando frequência...
      </div>
    );

    if (attendanceStats.length === 0) return (
      <div className="py-16 text-center">
        <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Sem dados de frequência ainda</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Registre presenças nas reuniões pelo Calendário para ver as métricas aqui.
        </p>
      </div>
    );

    const totalEvents = attendanceStats[0]?.total_events || 0;
    const recentW    = attendanceStats[0]?.recent_window || 3;
    const olderW     = attendanceStats[0]?.older_window || 5;

    return (
      <div>
        {/* Legenda */}
        <div className="mb-5 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Como ler</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span><strong>Velocidade</strong> — % de presenças nas últimas {totalEvents} reuniões</span>
            <span><strong>Aceleração</strong> — variação entre últimas {recentW} vs {olderW} anteriores</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {(Object.entries(QUADRANT_CONFIG) as [Quadrant, any][]).map(([key, cfg]) => (
              <span key={key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {attendanceStats.map((stat) => {
            const cfg = QUADRANT_CONFIG[stat.quadrant];
            const velPct = Math.round(stat.velocidade * 100);
            const accPct = Math.round(stat.aceleracao * 100);
            const accStr = stat.aceleracao > 0 ? `+${accPct}%` : `${accPct}%`;
            const needsAttention = stat.quadrant === 'sumindo' || stat.quadrant === 'irregular';

            return (
              <div key={stat.person_id} className={`bg-white dark:bg-slate-800 rounded-lg border ${cfg.border} p-4`}>
                <div className="flex items-center gap-3 mb-3">
                  {/* Nome e badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">{stat.full_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {/* Aceleração */}
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                    <AccIcon v={stat.aceleracao} />
                    <span className={stat.aceleracao >= 0.15 ? 'text-green-600' : stat.aceleracao <= -0.15 ? 'text-red-600' : 'text-gray-400'}>
                      {accStr}
                    </span>
                  </div>
                </div>

                {/* Barra de velocidade */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Velocidade: {stat.attended_total}/{stat.total_events} reuniões</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">{velPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${velPct >= 60 ? 'bg-green-500' : velPct >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${velPct}%` }}
                    />
                  </div>
                </div>

                {/* Detalhe recente vs anterior */}
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>Recentes ({stat.recent_window}): <strong className="text-gray-700 dark:text-gray-200">{stat.attended_recent}/{stat.recent_window}</strong></span>
                  {stat.older_window > 0 && (
                    <span>Anteriores ({stat.older_window}): <strong className="text-gray-700 dark:text-gray-200">{stat.attended_older}/{stat.older_window}</strong></span>
                  )}
                </div>

                {/* Botão IA apenas para quem precisa de atenção */}
                {needsAttention && (
                  <div className={`rounded-lg overflow-hidden ${aiMessages[stat.person_id] ? 'border border-violet-200 dark:border-violet-800' : ''}`}>
                    {!aiMessages[stat.person_id] ? (
                      <button
                        onClick={() => handleGenerate(
                          { id: stat.person_id, full_name: stat.full_name, phone: stat.phone, whatsapp: stat.whatsapp },
                          stat.quadrant === 'sumindo' ? 'resgate' : 'checkin'
                        )}
                        disabled={aiLoading[stat.person_id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg"
                      >
                        {aiLoading[stat.person_id]
                          ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Gerando...</>
                          : <><Sparkles className="w-3 h-3" />Mensagem IA</>}
                      </button>
                    ) : (
                      <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg border border-violet-100 dark:border-violet-800">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{aiMessages[stat.person_id]}</p>
                        <div className="flex gap-2 flex-wrap">
                          <WhatsAppShare
                            phone={stat.whatsapp || stat.phone || ''}
                            message={aiMessages[stat.person_id]}
                            onCopy={() => setCopied((p) => ({ ...p, [stat.person_id]: true }))}
                          />
                          <button onClick={() => handleGenerate({ id: stat.person_id, full_name: stat.full_name, phone: stat.phone, whatsapp: stat.whatsapp }, stat.quadrant === 'sumindo' ? 'resgate' : 'checkin')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-lg">
                            <Sparkles className="w-3 h-3" />Regerar
                          </button>
                          <button onClick={() => setAiMessages((p) => { const n = { ...p }; delete n[stat.person_id]; return n; })}
                            className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- IA ---
  const handleGenerate = async (person: Person | { id: string; full_name: string; phone?: string; whatsapp?: string }, messageType: 'aniversario' | 'resgate' | 'checkin') => {
    setAiLoading((p) => ({ ...p, [person.id]: true }));
    setAiMessages((p) => { const n = { ...p }; delete n[person.id]; return n; });
    try {
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageType, personName: person.full_name.split(' ')[0] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiMessages((p) => ({ ...p, [person.id]: data.message }));
    } catch (err) {
      console.error('Erro IA:', err);
    } finally {
      setAiLoading((p) => ({ ...p, [person.id]: false }));
    }
  };

  const handleCopy = (personId: string, msg: string) => {
    navigator.clipboard.writeText(msg);
    setCopied((p) => ({ ...p, [personId]: true }));
    setTimeout(() => setCopied((p) => ({ ...p, [personId]: false })), 2000);
  };

  // Serafim só pode gerenciar grupos dos quais é membro
  const isMyGroup =
    role !== 'Serafim' ||
    members.some((m) => m.person.email?.toLowerCase() === user?.email?.toLowerCase());

  // Pode escrever no grupo: Arcanjo/Querubim sempre; Serafim só se for membro
  const canWrite = role === 'Arcanjo' || role === 'Querubim' || (role === 'Serafim' && isMyGroup);

  // --- Stats calculadas ---
  const getUpcomingBirthdays = () => {
    const today = new Date();
    const future = new Date(); future.setDate(future.getDate() + 7);
    return members.filter((m) => {
      if (!m.person.date_of_birth) return false;
      const [, month, day] = m.person.date_of_birth.split('T')[0].split('-').map(Number);
      const bday = new Date(today.getFullYear(), month - 1, day);
      const todayN = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const futureN = new Date(future.getFullYear(), future.getMonth(), future.getDate());
      if (bday < todayN) bday.setFullYear(bday.getFullYear() + 1);
      return bday >= todayN && bday <= futureN;
    }).map((m) => m.person);
  };

  const absentMembers = members.filter((m) => m.person.status === 'absent').map((m) => m.person);
  const activeMembers = members.filter((m) => m.person.status === 'active_member').length;
  const birthdayMembers = getUpcomingBirthdays();

  // --- Handlers existentes ---
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remover membro do grupo?')) return;
    try {
      const res = await fetchWithAuth('/api/groups/remove-member', {
        method: 'DELETE',
        body: JSON.stringify({ membershipId: memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadGroupData();
    } catch (error) { console.error('Erro:', error); setError('Erro ao remover membro'); }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) { setError('Nome do grupo e obrigatorio'); return; }
    setSaving(true);
    try {
      // Geocodificar endereço se preenchido (endereço OU cidade)
      let lat: number | null = null;
      let lon: number | null = null;
      let geocode_status: string | null = null;
      let geocodingAttempted = false;

      // Se não há endereço mas há anfitrião, usar coords/endereço do anfitrião
      let effectiveAddress = formData.meeting_address;
      let effectiveCity = formData.meeting_city;
      if (!effectiveAddress && !effectiveCity && formData.host_id) {
        const hostPerson = allChurchPeople.find((p) => p.id === formData.host_id);
        if (hostPerson?.lat && hostPerson?.lon) {
          // Anfitrião já tem coordenadas — usar diretamente, sem geocodificar
          lat = hostPerson.lat;
          lon = hostPerson.lon;
          geocode_status = 'ok';
          geocodingAttempted = true;
        } else {
          effectiveAddress = hostPerson?.address || '';
          effectiveCity = hostPerson?.city || '';
        }
      }

      if (!geocodingAttempted && (effectiveAddress || effectiveCity)) {
        geocodingAttempted = true;
        try {
          const params = new URLSearchParams();
          if (effectiveAddress) params.set('address', effectiveAddress);
          if (effectiveCity) params.set('city', effectiveCity);
          // Para grupos, aceita resultado aproximado (nivel de cidade e ok)
          if (!effectiveAddress && effectiveCity) params.set('city_only', '1');
          const geoRes = await fetch('/api/geocode?' + params.toString());
          if (geoRes.ok) {
            const coords = await geoRes.json();
            lat = coords.lat; lon = coords.lon; geocode_status = 'ok';
          } else { geocode_status = 'failed'; }
        } catch { geocode_status = 'failed'; }
      }
      const { error: err } = await updateGroup(id as string, {
        name: formData.name,
        meeting_day: formData.meeting_day || null,
        meeting_time: formData.meeting_time || null,
        meeting_address: formData.meeting_address || null,
        meeting_city: formData.meeting_city || null,
        ...(geocodingAttempted ? { lat, lon, geocode_status } : {}),
        parent_group_id: formData.parent_group_id || null,
        leader_id: formData.leader_id || null,
        host_id: formData.host_id || null,
      });
      if (err) throw err;
      setIsEditing(false);
      loadGroupData();
    } catch (error) { console.error('Erro:', error); setError('Erro ao atualizar grupo'); }
    finally { setSaving(false); }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Tem certeza que deseja deletar este grupo?')) return;
    try {
      const { error: err } = await deleteGroup(id as string);
      if (err) throw err;
      router.push('/groups');
    } catch (error) { console.error('Erro:', error); setError('Erro ao deletar grupo'); }
  };

  const handleAddMeeting = async () => {
    if (!newMeeting.day_of_week) return;
    setAddingMeeting(true);
    try {
      const { error: err } = await addGroupMeeting(id as string, {
        day_of_week: newMeeting.day_of_week,
        time: newMeeting.time || null,
        event_type: newMeeting.event_type || null,
      });
      if (err) throw err;
      const { data } = await getGroupMeetings(id as string);
      setMeetings(data || []);
      setNewMeeting({ day_of_week: 'domingo', time: '19:00', event_type: '' });
    } catch (e) { console.error(e); setError('Erro ao adicionar reuniao'); }
    finally { setAddingMeeting(false); }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const { error: err } = await deleteGroupMeeting(meetingId);
      if (err) throw err;
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    } catch (e) { console.error(e); setError('Erro ao remover reuniao'); }
  };

  const startEditMeeting = (m: any) => {
    setEditingMeetingId(m.id);
    setEditingMeetingData({ day_of_week: m.day_of_week, time: m.time || '19:00', event_type: m.event_type || 'gceu' });
  };

  const handleUpdateMeeting = async (meetingId: string) => {
    try {
      const { error: err } = await updateGroupMeeting(meetingId, editingMeetingData);
      if (err) throw err;
      setMeetings((prev) => prev.map((m) => m.id === meetingId ? { ...m, ...editingMeetingData } : m));
      setEditingMeetingId(null);
    } catch (e) { console.error(e); setError('Erro ao atualizar reuniao'); }
  };

  const loadAvailablePeople = async () => {
    setLoadingPeople(true);
    try {
      const churchId = church_id || '';
      const { data, error } = await getPeople(churchId, undefined, searchPeople || undefined);
      if (error) throw error;
      const memberPersonIds = members.map((m) => m.person.id);
      setAvailablePeople((data || []).filter((p: any) => !memberPersonIds.includes(p.id)));
    } catch (error) { console.error('Erro:', error); setError('Erro ao carregar pessoas'); }
    finally { setLoadingPeople(false); }
  };

  const handleAddMember = async (personId: string) => {
    setAddingMember(true);
    try {
      const { error: err } = await addGroupMember(id as string, personId);
      if (err) throw err;
      setSearchPeople(''); setShowAddForm(false); loadGroupData();
    } catch (error) { console.error('Erro:', error); setError('Erro ao adicionar membro'); }
    finally { setAddingMember(false); }
  };

  const handleOpenAddForm = () => { setShowAddForm(true); loadAvailablePeople(); };

  // Render IA row
  const renderAiRow = (person: Person, messageType: 'aniversario' | 'resgate' | 'checkin', bg: string) => (
    <div key={person.id} className={`rounded-lg overflow-hidden ${aiMessages[person.id] ? 'border border-violet-200 dark:border-violet-800' : ''}`}>
      <div className={`flex justify-between items-center p-3 ${bg}`}>
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{person.full_name}</p>
          {person.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{person.phone}</p>}
        </div>
        {!aiMessages[person.id] ? (
          <button
            onClick={() => handleGenerate(person, messageType)}
            disabled={aiLoading[person.id]}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {aiLoading[person.id]
              ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Gerando...</>
              : <><Sparkles className="w-3 h-3" />Mensagem IA</>}
          </button>
        ) : null}
      </div>
      {aiMessages[person.id] && (
        <div className="bg-violet-50 dark:bg-violet-900/20 p-3 border-t border-violet-100 dark:border-violet-800">
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{aiMessages[person.id]}</p>
          <div className="flex gap-2 flex-wrap">
            <WhatsAppShare
              phone={person.whatsapp || person.phone || ''}
              message={aiMessages[person.id]}
              onCopy={() => setCopied((p) => ({ ...p, [person.id]: true }))}
            />
            <button
              onClick={() => handleGenerate(person, messageType)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-lg"
            >
              <Sparkles className="w-3 h-3" />
              Regerar
            </button>
            <button
              onClick={() => setAiMessages((p) => { const n = { ...p }; delete n[person.id]; return n; })}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6">
        Voltar
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex justify-between items-center">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')}><X className="w-5 h-5 text-red-600" /></button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : (
        <>
          {/* Info / Edição */}
          {isEditing ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-4">Editar Grupo</h2>
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Grupo *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grupo Pai</label>
                  <select value={formData.parent_group_id} onChange={(e) => setFormData({ ...formData, parent_group_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Nenhum (grupo raiz)</option>
                    {allGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lider do Grupo</label>
                  <select value={formData.leader_id} onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Selecione um lider</option>
                    {allChurchPeople.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anfitrião</label>
                  <select value={formData.host_id} onChange={(e) => {
                    const hostId = e.target.value;
                    const hostPerson = allChurchPeople.find((p) => p.id === hostId);
                    setFormData((prev) => ({
                      ...prev,
                      host_id: hostId,
                      // Auto-preenche endereço se não houver endereço manual
                      meeting_address: prev.meeting_address || (hostPerson?.address ?? ''),
                      meeting_city: prev.meeting_city || (hostPerson?.city ?? ''),
                    }));
                  }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Nenhum anfitrião</option>
                    {allChurchPeople.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">O endereço do anfitrião será usado como sede do grupo no mapa.</p>
                </div>
                {/* Reunioes multiplas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reunioes</label>
                  {meetings.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {meetings.map((m) => (
                        <div key={m.id} className="bg-gray-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
                          {editingMeetingId === m.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <select value={editingMeetingData.day_of_week}
                                  onChange={(e) => setEditingMeetingData({ ...editingMeetingData, day_of_week: e.target.value })}
                                  className="px-2 py-1 text-sm border border-primary-400 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white focus:outline-none">
                                  <option value="segunda">Segunda</option>
                                  <option value="terca">Terca</option>
                                  <option value="quarta">Quarta</option>
                                  <option value="quinta">Quinta</option>
                                  <option value="sexta">Sexta</option>
                                  <option value="sabado">Sabado</option>
                                  <option value="domingo">Domingo</option>
                                </select>
                                <input type="time" value={editingMeetingData.time}
                                  onChange={(e) => setEditingMeetingData({ ...editingMeetingData, time: e.target.value })}
                                  className="px-2 py-1 text-sm border border-primary-400 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white focus:outline-none" />
                              </div>
                              <select value={editingMeetingData.event_type}
                                onChange={(e) => setEditingMeetingData({ ...editingMeetingData, event_type: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-primary-400 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white focus:outline-none">
                                <option value="gceu">GCEU / Grupo</option>
                                <option value="culto">Culto</option>
                                <option value="estudo_biblico">Estudo Biblico</option>
                                <option value="reuniao_ministerio">Reuniao de Ministerio</option>
                                <option value="missoes">Missoes</option>
                                <option value="evangelismo">Evangelismo</option>
                                <option value="outro">Outro</option>
                              </select>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleUpdateMeeting(m.id)}
                                  className="flex-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg">
                                  Salvar
                                </button>
                                <button type="button" onClick={() => setEditingMeetingId(null)}
                                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800 dark:text-gray-200">
                                {DAY_LABELS[m.day_of_week] || m.day_of_week}
                                {m.time ? ` ${m.time}` : ''}
                                {m.event_type ? ` — ${m.event_type}` : ''}
                              </span>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => startEditMeeting(m)} className="text-gray-400 hover:text-primary-500 p-1">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => handleDeleteMeeting(m.id)} className="text-red-500 hover:text-red-700 p-1">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2 items-end">
                    <div className="col-span-2">
                      <select value={newMeeting.day_of_week} onChange={(e) => setNewMeeting({ ...newMeeting, day_of_week: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="segunda">Segunda</option>
                        <option value="terca">Terca</option>
                        <option value="quarta">Quarta</option>
                        <option value="quinta">Quinta</option>
                        <option value="sexta">Sexta</option>
                        <option value="sabado">Sabado</option>
                        <option value="domingo">Domingo</option>
                      </select>
                    </div>
                    <div>
                      <input type="time" value={newMeeting.time} onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <button type="button" onClick={handleAddMeeting} disabled={addingMeeting}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg">
                        <Plus className="w-4 h-4" />{addingMeeting ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <select value={newMeeting.event_type}
                      onChange={(e) => setNewMeeting({ ...newMeeting, event_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="gceu">GCEU / Grupo</option>
                      <option value="culto">Culto</option>
                      <option value="estudo_biblico">Estudo Biblico</option>
                      <option value="reuniao_ministerio">Reuniao de Ministerio</option>
                      <option value="missoes">Missoes</option>
                      <option value="evangelismo">Evangelismo</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endereco</label>
                  <input type="text" value={formData.meeting_address} onChange={(e) => setFormData({ ...formData, meeting_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cidade</label>
                  <input type="text" value={formData.meeting_city} onChange={(e) => setFormData({ ...formData, meeting_city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Ibaiti" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg">
                    {saving ? 'Salvando...' : 'Salvar Alteracoes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 text-gray-900 dark:text-white font-semibold py-2 rounded-lg">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-950 dark:text-white">{group?.name}</h1>
                  {parentGroup && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Subgrupo de: <span className="font-semibold">{parentGroup.name}</span></p>}
                  {group?.leader && <p className="text-gray-600 dark:text-gray-400 mt-2">Lider: <span className="font-semibold text-gray-800 dark:text-gray-200">{group.leader.full_name}</span></p>}
                  {group?.host && <p className="text-gray-600 dark:text-gray-400 mt-1">Anfitrião: <span className="font-semibold text-gray-800 dark:text-gray-200">{group.host.full_name}</span></p>}
                  {meetings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {meetings.map((m) => (
                        <p key={m.id} className="text-gray-600 dark:text-gray-400 text-sm">
                          📅 {DAY_LABELS[m.day_of_week] || m.day_of_week}
                          {m.time ? ` as ${m.time}` : ''}
                          {m.event_type ? ` — ${m.event_type}` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                  {group?.meeting_address && <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">📍 {group.meeting_address}{group?.meeting_city ? `, ${group.meeting_city}` : ''}</p>}
                </div>
                <div className="flex gap-2">
                  {canWrite && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                      <Edit2 className="w-5 h-5" />Editar
                    </button>
                  )}
                  {role === 'Arcanjo' && (
                    <button onClick={handleDeleteGroup} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      <TrashIcon className="w-5 h-5" />Deletar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Abas */}
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg mb-6 w-fit">
            {([
              { key: 'geral',      label: 'Visão Geral' },
              { key: 'frequencia', label: 'Frequência' },
              { key: 'membros',    label: `Membros (${members.length})` },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeTab === key
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Visao Geral do Grupo */}
          {activeTab === 'geral' && members.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{members.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Membros Ativos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeMembers}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-amber-500 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Afastados</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{absentMembers.length}</p>
                  </div>
                  <UserMinus className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
              </div>

              {/* Acoes Pastorais com IA */}
              {(birthdayMembers.length > 0 || absentMembers.length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Acoes Pastorais com IA</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {birthdayMembers.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-t-4 border-red-400">
                        <div className="flex items-center gap-2 mb-3">
                          <Cake className="w-4 h-4 text-red-500" />
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Aniversariantes (7 dias)</h4>
                          <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{birthdayMembers.length}</span>
                        </div>
                        <div className="space-y-2">
                          {birthdayMembers.map((p) => renderAiRow(p, 'aniversario', 'bg-red-50 dark:bg-red-900/10'))}
                        </div>
                      </div>
                    )}
                    {absentMembers.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-t-4 border-amber-400">
                        <div className="flex items-center gap-2 mb-3">
                          <UserMinus className="w-4 h-4 text-amber-500" />
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Afastados no grupo</h4>
                          <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{absentMembers.length}</span>
                        </div>
                        <div className="space-y-2">
                          {absentMembers.map((p) => renderAiRow(p, 'resgate', 'bg-amber-50 dark:bg-amber-900/10'))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba Frequência */}
          {activeTab === 'frequencia' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-950 dark:text-white">Frequência dos Membros</h2>
                </div>
                <button onClick={loadAttendanceStats}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 font-medium">
                  ↻ Atualizar
                </button>
              </div>
              {renderFrequencyTab()}
            </div>
          )}

          {/* Membros */}
          {activeTab === 'membros' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Membros ({members.length})</h2>
              {canWrite && (
                <button onClick={handleOpenAddForm} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                  <Plus className="w-5 h-5" />Adicionar Membro
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Adicionar Membro</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buscar Pessoa</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Digite o nome..."
                      value={searchPeople}
                      onChange={(e) => {
                        setSearchPeople(e.target.value);
                        if (e.target.value.length > 0) {
                          setLoadingPeople(true);
                          setTimeout(() => {
                            const churchId = church_id || '';
                            getPeople(churchId, undefined, e.target.value).then(({ data }) => {
                              const ids = members.map((m) => m.person.id);
                              setAvailablePeople((data || []).filter((p: any) => !ids.includes(p.id)));
                              setLoadingPeople(false);
                            });
                          }, 300);
                        } else {
                          loadAvailablePeople();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                {loadingPeople ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">Buscando...</p>
                ) : availablePeople.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {searchPeople ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa disponivel'}
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {availablePeople.map((person: any) => (
                      <div key={person.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">{person.full_name}</p>
                          {person.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{person.phone}</p>}
                        </div>
                        <button onClick={() => handleAddMember(person.id)} disabled={addingMember}
                          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium">
                          {addingMember ? 'Adicionando...' : 'Adicionar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {members.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhum membro neste grupo</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                    <div className="cursor-pointer flex-1" onClick={() => router.push(`/people/${member.person.id}`)}>
                      <h3 className="font-bold text-gray-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{member.person.full_name}</h3>
                      {member.person.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{member.person.phone}</p>}
                    </div>
                    {canWrite && (
                      <button onClick={() => handleRemoveMember(member.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
