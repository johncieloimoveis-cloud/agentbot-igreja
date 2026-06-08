import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'pastor' | 'secretary' | 'group_leader' | 'ministry_leader';
  church_id: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export async function getUsers(churchId: string) {
  return supabase
    .from('users')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });
}

export async function getUser(id: string) {
  return supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createUser(data: {
  email: string;
  full_name?: string;
  role: 'admin' | 'pastor' | 'secretary' | 'group_leader' | 'ministry_leader';
  church_id: string;
}) {
  return supabase
    .from('users')
    .insert([{
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
}

export async function updateUser(
  id: string,
  data: {
    full_name?: string;
    role?: 'admin' | 'pastor' | 'secretary' | 'group_leader' | 'ministry_leader';
  }
) {
  return supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteUser(id: string) {
  return supabase
    .from('users')
    .delete()
    .eq('id', id);
}

export function getRoleLabel(role: string): string {
  const labels: { [key: string]: string } = {
    admin: 'Administrador',
    pastor: 'Pastor',
    secretary: 'Secretário',
    group_leader: 'Líder de Grupo',
    ministry_leader: 'Líder de Ministério',
  };
  return labels[role] || role;
}

export function getRoleBadgeColor(role: string): string {
  const colors: { [key: string]: string } = {
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    pastor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    secretary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    group_leader: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    ministry_leader: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  };
  return colors[role] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
}
