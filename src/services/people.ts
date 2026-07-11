import { supabase } from './supabase';
export interface Person {
  id: string;
  church_id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  status: string;
  date_of_birth?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lat?: number | null;
  lon?: number | null;
}
// Listar pessoas
export const getPeople = async (
  churchId: string,
  status?: string,
  search?: string
) => {
  let query = supabase
    .from('people')
    .select('*')
    .eq('church_id', churchId)
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('full_name', `%${search}%`);
  return query;
};
// Criar pessoa (com verificacao de limite)
export const createPerson = async (
  churchId: string,
  data: Partial<Person>
) => {
  // Verifica limite de pessoas da igreja
  const [countRes, churchRes] = await Promise.all([
    supabase.from('people').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('is_active', true),
    supabase.from('churches').select('people_limit, plano').eq('id', churchId).single(),
  ]);

  const total = countRes.count ?? 0;
  const limit = churchRes.data?.people_limit ?? 50;
  const plano = churchRes.data?.plano ?? 'gratuito';

  if (plano === 'gratuito' && total >= limit) {
    return {
      data: null,
      error: {
        message: `Limite de ${limit} pessoas atingido. Atualize para o plano pagante ou ajuste o limite no painel admin.`,
        code: 'LIMIT_REACHED',
      },
    };
  }

  return supabase
    .from('people')
    .insert({
      ...data,
      church_id: churchId,
    })
    .select()
    .single();
};
// Atualizar pessoa
export const updatePerson = async (id: string, data: Partial<Person>) => {
  return supabase
    .from('people')
    .update(data)
    .eq('id', id)
    .select()
    .single();
};
// Deletar pessoa (soft delete)
export const deletePerson = async (id: string) => {
  return supabase
    .from('people')
    .update({ is_active: false })
    .eq('id', id);
};
// Buscar uma pessoa
export const getPerson = async (id: string) => {
  return supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single();
};
// ─── Vínculos familiares ──────────────────────────────────────────────────────

export const RELATIONSHIP_LABELS: Record<string, string> = {
  conjuge:      'Cônjuge',
  pai:          'Pai',
  mae:          'Mãe',
  filho:        'Filho',
  filha:        'Filha',
  irmao:        'Irmão',
  irma:         'Irmã',
  avo:          'Avô',
  avo_materna:  'Avó',
  neto:         'Neto',
  neta:         'Neta',
  outro:        'Outro',
};

export const RELATIONSHIP_INVERSE: Record<string, string> = {
  conjuge:     'conjuge',
  pai:         'filho',
  mae:         'filha',
  filho:       'pai',
  filha:       'mae',
  irmao:       'irmao',
  irma:        'irma',
  avo:         'neto',
  avo_materna: 'neta',
  neto:        'avo',
  neta:        'avo_materna',
  outro:       'outro',
};

export const getPersonRelationships = async (personId: string) => {
  return supabase
    .from('person_relationships')
    .select(`
      id,
      relationship_type,
      related_person_id,
      related:people!person_relationships_related_person_id_fkey(id, full_name)
    `)
    .eq('person_id', personId)
    .order('relationship_type');
};

export const addPersonRelationship = async (
  churchId: string,
  personId: string,
  relatedPersonId: string,
  relationshipType: string
) => {
  const inverse = RELATIONSHIP_INVERSE[relationshipType] ?? 'outro';
  const [a, b] = await Promise.all([
    supabase.from('person_relationships').upsert(
      { church_id: churchId, person_id: personId, related_person_id: relatedPersonId, relationship_type: relationshipType },
      { onConflict: 'person_id,related_person_id,relationship_type' }
    ),
    supabase.from('person_relationships').upsert(
      { church_id: churchId, person_id: relatedPersonId, related_person_id: personId, relationship_type: inverse },
      { onConflict: 'person_id,related_person_id,relationship_type' }
    ),
  ]);
  return a.error ? a : b;
};

export const removePersonRelationship = async (
  relationshipId: string,
  personId: string,
  relatedPersonId: string,
  relationshipType: string
) => {
  const inverse = RELATIONSHIP_INVERSE[relationshipType] ?? 'outro';
  await Promise.all([
    supabase.from('person_relationships').delete().eq('id', relationshipId),
    supabase.from('person_relationships').delete()
      .eq('person_id', relatedPersonId)
      .eq('related_person_id', personId)
      .eq('relationship_type', inverse),
  ]);
};

// Listar todas as pessoas com endereço (para mapa da congregação)
export const getPeopleWithAddress = async (churchId: string) => {
  return supabase
    .from('people')
    .select('id, full_name, address, city, status, lat, lon')
    .eq('church_id', churchId)
    .eq('is_active', true)
    .not('address', 'is', null)
    .neq('address', '')
    .order('full_name');
};
