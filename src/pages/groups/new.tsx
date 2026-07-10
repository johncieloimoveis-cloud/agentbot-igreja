import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createGroup, getGroups, addGroupMeeting } from '@/services/groups';
import { getPeople } from '@/services/people';
import { Trash2 } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';

interface Meeting {
  id?: string;
  day_of_week: string;
  time: string;
  description: string;
  event_type: string;
}

export default function NewGroup() {
  const router = useRouter();
  const { user, church_id } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    meeting_address: '',
    parent_group_id: '',
    leader_id: '',
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeeting, setNewMeeting] = useState<Meeting>({
    day_of_week: '',
    time: '',
    description: '',
    event_type: 'gceu',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [hasRootGroup, setHasRootGroup] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const churchId = church_id || '';
      const [groupsRes, peopleRes] = await Promise.all([
        getGroups(churchId),
        getPeople(churchId),
      ]);
      const grps = groupsRes.data || [];
      setGroups(grps);
      setPeople(peopleRes.data || []);
      setHasRootGroup(grps.some((g: any) => !g.parent_group_id));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddMeeting = () => {
    if (!newMeeting.day_of_week || !newMeeting.time) {
      setError('Dia e horário são obrigatórios');
      return;
    }
    setMeetings([...meetings, { ...newMeeting, id: Date.now().toString() }]);
    setNewMeeting({ day_of_week: '', time: '', description: '', event_type: 'gceu' });
    setError('');
  };

  const handleRemoveMeeting = (id: string) => {
    setMeetings(meetings.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    if (!formData.leader_id) {
      setError('Selecione um líder para o grupo');
      return;
    }

    if (hasRootGroup && !formData.parent_group_id) {
      setError('Esta igreja ja possui um grupo raiz. Selecione um grupo pai.');
      return;
    }

    setSaving(true);
    try {
      const churchId = church_id || '';
      const dataToSubmit = {
        name: formData.name,
        meeting_address: formData.meeting_address || null,
        parent_group_id: formData.parent_group_id ? formData.parent_group_id : null,
        leader_id: formData.leader_id,
      };

      console.log('1. Enviando dados do grupo:', dataToSubmit);
      const { data: groupData, error: groupError } = await createGroup(churchId, dataToSubmit);
      console.log('2. Resposta createGroup:', { data: groupData, error: groupError });

      if (groupError) {
        console.error('3. Erro ao criar grupo:', groupError);
        throw groupError;
      }

      console.log('4. Grupo criado com ID:', groupData.id);

      // Adicionar reuniões
      for (const meeting of meetings) {
        console.log('5. Adicionando reunião:', meeting);
        const { error: meetingError } = await addGroupMeeting(groupData.id, {
          day_of_week: meeting.day_of_week,
          time: meeting.time,
          description: meeting.description || null,
          event_type: meeting.event_type || 'gceu',
        });
        if (meetingError) console.error('Erro ao adicionar reunião:', meetingError);
      }

      console.log('6. Redirecionando para /groups');
      router.push('/groups');
    } catch (err) {
      setError('Erro ao criar grupo');
      console.error('Erro completo:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const dayLabels: { [key: string]: string } = {
    segunda: 'Segunda',
    terca: 'Terça',
    quarta: 'Quarta',
    quinta: 'Quinta',
    sexta: 'Sexta',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white mb-6"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Novo Grupo</h1>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Grupo *
            <HelpTooltip text="Nome do grupo como aparecerá no sistema. Ex: GCEU Zona Norte, Ministério de Louvor, IMW Ibaiti." />
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: IMW Ibaiti"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Líder do Grupo *
            <HelpTooltip text="Pessoa responsável pelo grupo. Receberá notificações e aparecerá como referência nos relatórios." />
          </label>
          <select
            value={formData.leader_id}
            onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
            disabled={loadingData}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <option value="">Selecione um líder</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grupo Pai (Opcional)
            <HelpTooltip text="Se este grupo pertence a outro maior. Ex: GCEU Zona Norte pode ser filho de IMW Ibaiti. Usado para organizar o organograma da igreja." />
          </label>
          <select
            value={formData.parent_group_id}
            onChange={(e) => setFormData({ ...formData, parent_group_id: e.target.value })}
            disabled={loadingData}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <option value="" disabled={hasRootGroup}>
              {hasRootGroup ? 'Grupo raiz ja existe — selecione um pai abaixo' : 'Nenhum (grupo raiz)'}
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endereço
            <HelpTooltip text="Local onde o grupo se reúne habitualmente. Aparece no calendário ao clicar no evento." />
          </label>
          <input
            type="text"
            value={formData.meeting_address}
            onChange={(e) => setFormData({ ...formData, meeting_address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Rua, número, complemento"
          />
        </div>

        {/* Reuniões */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-950 dark:text-white mb-4">
            Dias de Reunião
            <HelpTooltip text="Configure quantos dias de reunião o grupo tiver. Ex: um GCEU que se reúne toda terça às 20h, ou uma Igreja que tem culto domingo e quarta." />
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dia da Semana *
                <HelpTooltip text="Dia da semana em que este encontro acontece. O calendário usará este dado para gerar automaticamente as datas do mês." />
              </label>
              <select
                value={newMeeting.day_of_week}
                onChange={(e) => setNewMeeting({ ...newMeeting, day_of_week: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione</option>
                <option value="segunda">Segunda</option>
                <option value="terca">Terça</option>
                <option value="quarta">Quarta</option>
                <option value="quinta">Quinta</option>
                <option value="sexta">Sexta</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horário *
                  <HelpTooltip text="Hora de início do encontro. Aparece no calendário ao clicar no evento." />
                </label>
                <input
                  type="time"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de evento
                  <HelpTooltip text="Define a cor deste encontro no calendário. Use Culto para cultos de adoração, GCEU para células, etc." />
                </label>
                <select
                  value={newMeeting.event_type}
                  onChange={(e) => setNewMeeting({ ...newMeeting, event_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="culto">⛪ Culto</option>
                  <option value="gceu">👥 GCEU / Grupo</option>
                  <option value="missoes">🌍 Missões</option>
                  <option value="evangelismo">📢 Evangelismo</option>
                  <option value="estudo_biblico">📖 Estudo Bíblico</option>
                  <option value="reuniao_ministerio">🙏 Reunião de Ministério</option>
                  <option value="outro">📋 Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Observação opcional"
              />
            </div>

            <button
              type="button"
              onClick={handleAddMeeting}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Adicionar Reunião
            </button>
          </div>

          {/* Lista de reuniões */}
          {meetings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Reuniões adicionadas:</h4>
              {meetings.map((meeting) => (
                <div key={meeting.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-950 dark:text-white">
                      {dayLabels[meeting.day_of_week]} às {meeting.time}
                    </p>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{meeting.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMeeting(meeting.id!)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
        >
          {saving ? 'Criando...' : 'Criar Grupo'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white"
      >
        ← Voltar
      </button>
    </div>
  );
}
