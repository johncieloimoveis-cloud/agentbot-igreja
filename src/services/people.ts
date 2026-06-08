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
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('full_name', `%${search}%`);

  return query;
};

// Criar pessoa
export const createPerson = async (
  churchId: string,
  data: Partial<Person>
) => {
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