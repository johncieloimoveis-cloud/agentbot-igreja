import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getGroupMembers, removeGroupMember, updateGroup, deleteGroup, getGroup, addGroupMember, getGroups } from '@/services/groups';
import { getPeople } from '@/services/people';
import { TrashIcon, Plus, Edit2, X, Search } from 'lucide-react';

interface Member {
  id: string;
  person: {
    id: string;
    full_name: string;
    phone?: string;
  };
}

interface Group {
  id: string;
  name: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_address?: string;
  parent_group_id?: string;
}

export default function GroupDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [availablePeople, setAvailablePeople] = useState<any[]>([]);
  const [searchPeople, setSearchPeople] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [parentGroup, setParentGroup] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    meeting_day: '',
    meeting_time: '',
    meeting_address: '',
    parent_group_id: '',
    leader_id: '',
  });

  useEffect(() => {
    if (!id) return;
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

      // Carregar dados do grupo
      const { data: groupData, error: groupError } = await getGroup(id as string);
      if (groupError) throw groupError;

      setGroup(groupData);
      setFormData({
        name: groupData?.name || '',
        meeting_day: groupData?.meeting_day || '',
        meeting_time: groupData?.meeting_time || '',
        meeting_address: groupData?.meeting_address || '',
        parent_group_id: groupData?.parent_group_id || '',
        leader_id: groupData?.leader_id || '',
      });

      // Carregar todos os grupos (para dropdown de grupo pai)
      const { data: groupsData, error: groupsError } = await getGroups(churchId);
      if (groupsError) throw groupsError;
      // Filtrar para não mostrar o grupo atual
      const filteredGroups = (groupsData || []).filter((g: any) => g.id !== id);
      setAllGroups(filteredGroups);

      // Carregar grupo pai se existir
      if (groupData?.parent_group_id) {
        const { data: parentGroupData } = await getGroup(groupData.parent_group_id);
        setParentGroup(parentGroupData);
      }

      // Carregar membros
      const { data: membersData, error: membersError } = await getGroupMembers(id as string);
      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remover membro do grupo?')) return;
    try {
      await removeGroupMember(memberId);
      loadGroupData();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao remover membro');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const dataToSubmit = {
        name: formData.name,
        meeting_day: formData.meeting_day || null,
        meeting_time: formData.meeting_time || null,
        meeting_address: formData.meeting_address || null,
        parent_group_id: formData.parent_group_id ? formData.parent_group_id : null,
        leader_id: formData.leader_id ? formData.leader_id : null,
      };
      console.log('Atualizando grupo com dados:', dataToSubmit);
      const { error: err } = await updateGroup(id as string, dataToSubmit);
      if (err) throw err;

      setIsEditing(false);
      loadGroupData();
    } catch (error) {
      console.error('Erro completo:', error);
      setError('Erro ao atualizar grupo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Tem certeza que deseja deletar este grupo? Esta ação não pode ser desfeita.')) return;

    try {
      const { error: err } = await deleteGroup(id as string);
      if (err) throw err;
      router.push('/groups');
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao deletar grupo');
    }
  };

  const loadAvailablePeople = async () => {
    setLoadingPeople(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getPeople(churchId, undefined, searchPeople || undefined);
      if (error) throw error;

      // Filtrar pessoas que já são membros
      const memberPersonIds = members.map((m) => m.person.id);
      const filteredPeople = (data || []).filter(
        (person: any) => !memberPersonIds.includes(person.id)
      );

      setAvailablePeople(filteredPeople);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar pessoas');
    } finally {
      setLoadingPeople(false);
    }
  };

  const handleAddMember = async (personId: string) => {
    setAddingMember(true);
    try {
      const { error: err } = await addGroupMember(id as string, personId);
      if (err) throw err;

      setSearchPeople('');
      setShowAddForm(false);
      loadGroupData();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao adicionar membro');
    } finally {
      setAddingMember(false);
    }
  };

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    loadAvailablePeople();
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6"
      >
        ← Voltar
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex justify-between items-center">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : (
        <>
          {/* Seção de Detalhes/Edição */}
          {isEditing ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-4">Editar Grupo</h2>
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Grupo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grupo Pai (Opcional)
                  </label>
                  <select
                    value={formData.parent_group_id}
                    onChange={(e) => setFormData({ ...formData, parent_group_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Nenhum (grupo raiz)</option>
                    {allGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Líder do Grupo
                  </label>
                  <select
                    value={formData.leader_id}
                    onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione um líder</option>
                    {members.map((m) => (
                      <option key={m.person.id} value={m.person.id}>
                        {m.person.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dia da Reunião
                    </label>
                    <select
                      value={formData.meeting_day}
                      onChange={(e) => setFormData({ ...formData, meeting_day: e.target.value })}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={formData.meeting_time}
                      onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.meeting_address}
                    onChange={(e) => setFormData({ ...formData, meeting_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white font-semibold py-2 rounded-lg"
                  >
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
                  {parentGroup && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      👥 Subgrupo de: <span className="font-semibold">{parentGroup.name}</span>
                    </p>
                  )}
                  {group?.meeting_day && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {group.meeting_day} às {group.meeting_time || 'Horário não definido'}
                    </p>
                  )}
                  {group?.meeting_address && (
                    <p className="text-gray-600 dark:text-gray-400">📍 {group.meeting_address}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Membros */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Membros ({members.length})</h2>
              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                Adicionar Membro
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Adicionar Membro</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Busca de Pessoas */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar Pessoa
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Digite o nome..."
                      value={searchPeople}
                      onChange={(e) => {
                        setSearchPeople(e.target.value);
                        // Fazer busca automática
                        if (e.target.value.length > 0) {
                          setLoadingPeople(true);
                          setTimeout(() => {
                            const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
                            getPeople(churchId, undefined, e.target.value).then(({ data }) => {
                              const memberPersonIds = members.map((m) => m.person.id);
                              const filteredPeople = (data || []).filter(
                                (person: any) => !memberPersonIds.includes(person.id)
                              );
                              setAvailablePeople(filteredPeople);
                              setLoadingPeople(false);
                            });
                          }, 300);
                        } else {
                          loadAvailablePeople();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Lista de Pessoas Disponíveis */}
                {loadingPeople ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">Buscando pessoas...</p>
                  </div>
                ) : availablePeople.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchPeople ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa disponível'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {availablePeople.map((person: any) => (
                      <div
                        key={person.id}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">{person.full_name}</p>
                          {person.phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{person.phone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddMember(person.id)}
                          disabled={addingMember}
                          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium"
                        >
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
                  <div
                    key={member.id}
                    className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition"
                  >
                    <div>
                      <h3 className="font-bold">{member.person.full_name}</h3>
                      {member.person.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.person.phone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}