import { supabase } from './supabase';

// Obter hierarquia completa de GRUPOS (árvore de grupos)
export const getGroupHierarchyTree = async (churchId: string) => {
  // Buscar todos os grupos ativos
  const { data: allGroups, error } = await supabase
    .from('groups')
    .select('id, name, leader_id, parent_group_id, status')
    .eq('church_id', churchId)
    .eq('status', 'active')
    .order('name');

  if (error) return { error };

  // Buscar líderes dos grupos
  const leaderIds = [...new Set((allGroups || []).map(g => g.leader_id).filter(Boolean))];
  let leaders: any[] = [];

  if (leaderIds.length > 0) {
    const { data: leadersData } = await supabase
      .from('people')
      .select('id, full_name')
      .in('id', leaderIds);
    leaders = leadersData || [];
  }

  const leaderMap = new Map(leaders.map(l => [l.id, l]));

  // Construir árvore
  const groupMap = new Map();
  const rootNodes: any[] = [];

  // Primeira passagem: adicionar todos os grupos ao mapa
  (allGroups || []).forEach((group) => {
    groupMap.set(group.id, {
      ...group,
      leader: group.leader_id ? leaderMap.get(group.leader_id) : null,
      children: [],
    });
  });

  // Segunda passagem: construir hierarquia
  (allGroups || []).forEach((group) => {
    if (group.parent_group_id) {
      const parent = groupMap.get(group.parent_group_id);
      if (parent) {
        parent.children.push(groupMap.get(group.id));
      }
    } else {
      // Grupos raiz (sem grupo pai)
      rootNodes.push(groupMap.get(group.id));
    }
  });

  return { data: rootNodes };
};

// Obter grupos liderados por uma pessoa
export const getGroupsLedBy = async (leaderId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, leader_id, parent_group_id, status')
    .eq('leader_id', leaderId)
    .eq('status', 'active')
    .order('name');

  return { data, error };
};

// Contar grupos liderados (diretos e indiretos)
export const countTeamSize = async (groupId: string): Promise<number> => {
  const { data: directSubgroups, error } = await supabase
    .from('groups')
    .select('id')
    .eq('parent_group_id', groupId)
    .eq('status', 'active');

  if (error) return 0;

  let total = directSubgroups?.length || 0;

  // Contar indiretamente
  for (const group of directSubgroups || []) {
    const indirectCount = await countTeamSize(group.id);
    total += indirectCount;
  }

  return total;
};

// Obter estatísticas de um grupo líder
export const getGroupLeaderStats = async (groupId: string) => {
  const { data: directSubgroups } = await supabase
    .from('groups')
    .select('id, status')
    .eq('parent_group_id', groupId)
    .eq('status', 'active');

  const teamSize = await countTeamSize(groupId);

  return {
    direct_subgroups: directSubgroups?.length || 0,
    total_team: teamSize,
  };
};
