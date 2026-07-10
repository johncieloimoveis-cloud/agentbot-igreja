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