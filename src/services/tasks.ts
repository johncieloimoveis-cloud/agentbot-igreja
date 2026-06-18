import { supabase } from './supabase';
// Listar tarefas
export const getTasks = async (churchId: string, status?: string) => {
  let query = supabase
    .from('tasks')
    .select('*, person:people(id, full_name)')
    .eq('church_id', churchId)
    .order('due_date', { ascending: true });
  if (status) query = query.eq('status', status);
  return query;
};
// Buscar uma tarefa específica
export const getTask = async (taskId: string) => {
  return supabase
    .from('tasks')
    .select('*, person:people(id, full_name)')
    .eq('id', taskId)
    .single();
};
// Criar nova tarefa
export const createTask = async (churchId: string, data: any) => {
  return supabase
    .from('tasks')
    .insert({
      ...data,
      church_id: churchId,
      status: 'pending',
    })
    .select()
    .single();
};
// Atualizar tarefa
export const updateTask = async (taskId: string, data: any) => {
  return supabase
    .from('tasks')
    .update(data)
    .eq('id', taskId)
    .select()
    .single();
};
// Deletar tarefa
export const deleteTask = async (taskId: string) => {
  return supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
};
// Marcar tarefa como concluída
export const completeTask = async (taskId: string) => {
  return supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)
    .select()
    .single();
};
// Obter tarefas de uma pessoa
export const getPersonTasks = async (personId: string) => {
  return supabase
    .from('tasks')
    .select('*')
    .eq('person_id', personId)
    .order('due_date', { ascending: true });
};
