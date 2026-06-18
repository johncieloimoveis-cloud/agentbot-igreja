import { supabase } from './supabase';
// Listar ministérios
export const getMinistries = async (churchId: string) => {
  return supabase
    .from('departments')
    .select('*')
    .eq('church_id', churchId)
    .order('name');
};
// Buscar um ministério específico
export const getMinistry = async (ministryId: string) => {
  return supabase
    .from('departments')
    .select('*')
    .eq('id', ministryId)
    .single();
};
// Criar novo ministério
export const createMinistry = async (churchId: string, data: any) => {
  return supabase
    .from('departments')
    .insert({
      ...data,
      church_id: churchId,
    })
    .select()
    .single();
};
// Atualizar ministério
export const updateMinistry = async (ministryId: string, data: any) => {
  return supabase
    .from('departments')
    .update(data)
    .eq('id', ministryId)
    .select()
    .single();
};
// Deletar ministério
export const deleteMinistry = async (ministryId: string) => {
  return supabase
    .from('departments')
    .delete()
    .eq('id', ministryId);
};
// Listar membros de um ministério
export const getMinistryMembers = async (ministryId: string) => {
  return supabase
    .from('department_members')
    .select('*, person:people(id, full_name, phone)')
    .eq('department_id', ministryId)
    .order('created_at');
};
// Adicionar pessoa a um ministério
export const addMinistryMember = async (ministryId: string, personId: string) => {
  return supabase
    .from('department_members')
    .insert({
      department_id: ministryId,
      person_id: personId,
    })
    .select()
    .single();
};
// Remover pessoa de um ministério
export const removeMinistryMember = async (membershipId: string) => {
  return supabase
    .from('department_members')
    .delete()
    .eq('id', membershipId);
};
// Obter ministérios de uma pessoa
export const getPersonMinistries = async (personId: string) => {
  return supabase
    .from('department_members')
    .select('*, department:departments(id, name)')
    .eq('person_id', personId)
    .order('created_at');
};
