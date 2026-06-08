import { supabase } from './supabase';

// Obter pessoa com seu líder/responsável
export const getPersonWithLeader = async (personId: string) => {
  const { data, error } = await supabase
    .from('people')
    .select('*, leader:people!responsible_id(id, full_name)')
    .eq('id', personId)
    .single();

  return { data, error };
};

// Listar todos os líderes da church
export const getLeaders = async (churchId: string) => {
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, status')
    .eq('church_id', churchId)
    .in('status', ['leader', 'active_member'])
    .order('full_name');

  return { data, error };
};

// Obter pessoas lideradas por um líder
export const getPeopleLedBy = async (leaderId: string) => {
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, status, photo_url')
    .eq('responsible_id', leaderId)
    .order('full_name');

  return { data, error };
};

// Atualizar líder de uma pessoa
export const updatePersonLeader = async (personId: string, leaderId: string | null) => {
  return supabase
    .from('people')
    .update({ responsible_id: leaderId })
    .eq('id', personId)
    .select()
    .single();
};

// Obter hierarquia completa (árvore de líderes)
export const getHierarchyTree = async (churchId: string) => {
  // Buscar todas as pessoas
  const { data: allPeople, error } = await supabase
    .from('people')
    .select('id, full_name, responsible_id, status')
    .eq('church_id', churchId)
    .order('full_name');

  if (error) return { error };

  // Construir árvore
  const peopleMap = new Map();
  const rootNodes: any[] = [];

  // Primeira passagem: adicionar todas as pessoas ao mapa
  (allPeople || []).forEach((person) => {
    peopleMap.set(person.id, {
      ...person,
      children: [],
    });
  });

  // Segunda passagem: construir hierarquia
  (allPeople || []).forEach((person) => {
    if (person.responsible_id) {
      const parent = peopleMap.get(person.responsible_id);
      if (parent) {
        parent.children.push(peopleMap.get(person.id));
      }
    } else {
      // Pessoas sem líder (raiz da árvore)
      rootNodes.push(peopleMap.get(person.id));
    }
  });

  return { data: rootNodes };
};

// Obter nível hierárquico de uma pessoa
export const getPersonHierarchyLevel = async (personId: string): Promise<number> => {
  const { data: person, error } = await supabase
    .from('people')
    .select('responsible_id')
    .eq('id', personId)
    .single();

  if (error || !person?.responsible_id) return 1;

  // Recursivamente obter o nível
  const level = await getPersonHierarchyLevel(person.responsible_id);
  return level + 1;
};

// Contar pessoas lideradas (diretas e indiretas)
export const countTeamSize = async (leaderId: string): Promise<number> => {
  const { data: directReports, error } = await supabase
    .from('people')
    .select('id')
    .eq('responsible_id', leaderId);

  if (error) return 0;

  let total = directReports?.length || 0;

  // Contar indiretamente
  for (const person of directReports || []) {
    const indirectCount = await countTeamSize(person.id);
    total += indirectCount;
  }

  return total;
};

// Obter estatísticas de um líder
export const getLeaderStats = async (leaderId: string) => {
  const { data: directReports } = await supabase
    .from('people')
    .select('id, status')
    .eq('responsible_id', leaderId);

  const teamSize = await countTeamSize(leaderId);

  const statuses: { [key: string]: number } = {};
  (directReports || []).forEach((person) => {
    statuses[person.status] = (statuses[person.status] || 0) + 1;
  });

  return {
    direct_reports: directReports?.length || 0,
    total_team: teamSize,
    statuses,
  };
};
