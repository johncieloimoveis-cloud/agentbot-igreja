import { supabase } from '@/services/supabase';
// Criar visitante (cadastro rápido)
export const createVisitor = async (
  churchId: string,
  data: {
    full_name: string;
    phone?: string;
    whatsapp?: string;
    culto_evento: string;
    como_conheceu: string;
    interesse_gceu: boolean;
    interesse_estudo: boolean;
    deseja_contato: boolean;
  }
) => {
  const notes = JSON.stringify({
    culto_evento: data.culto_evento,
    como_conheceu: data.como_conheceu,
    interesse_gceu: data.interesse_gceu,
    interesse_estudo: data.interesse_estudo,
    deseja_contato: data.deseja_contato,
    primeira_visita: new Date().toISOString(),
  });
  return supabase
    .from('people')
    .insert({
      church_id: churchId,
      full_name: data.full_name,
      phone: data.phone,
      whatsapp: data.whatsapp,
      status: 'visitor',
      notes: notes,
    })
    .select()
    .single();
};
// Listar visitantes
export const getVisitors = async (churchId: string, days?: number) => {
  let query = supabase
    .from('people')
    .select('*')
    .eq('church_id', churchId)
    .eq('status', 'visitor')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    query = query.gte('created_at', date.toISOString());
  }
  return query;
};
// Registrar retorno
export const registerVisitReturn = async (
  visitorId: string,
  culto_evento: string
) => {
  const { data: person, error: fetchError } = await supabase
    .from('people')
    .select('notes')
    .eq('id', visitorId)
    .single();
  if (fetchError) throw fetchError;
  let notes: any = { retornos: [] };
  try {
    notes = JSON.parse(person.notes || '{"retornos": []}');
  } catch {
    notes = { retornos: [] };
  }
  if (!notes.retornos) notes.retornos = [];
  notes.retornos.push({
    data: new Date().toISOString(),
    culto_evento: culto_evento,
  });
  return supabase
    .from('people')
    .update({ notes: JSON.stringify(notes) })
    .eq('id', visitorId);
};
// Converter visitante para membro/convertido
export const convertVisitor = async (
  visitorId: string,
  newStatus: 'active_member' | 'new_convert'
) => {
  return supabase
    .from('people')
    .update({ status: newStatus })
    .eq('id', visitorId);
};