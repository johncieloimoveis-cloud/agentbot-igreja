import { supabase } from './supabase';
export interface Announcement {
  id: string;
  church_id: string;
  title: string;
  description: string;
  priority: 'normal' | 'urgent';
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  creator?: { full_name: string; email: string };
}
export async function getAnnouncements(churchId: string) {
  return supabase
    .from('announcements')
    .select('*, creator:created_by(full_name, email)')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });
}
export async function getAnnouncement(id: string) {
  return supabase
    .from('announcements')
    .select('*, creator:created_by(full_name, email)')
    .eq('id', id)
    .single();
}
export async function createAnnouncement(data: {
  church_id: string;
  title: string;
  description: string;
  priority: 'normal' | 'urgent';
  created_by: string;
  expires_at?: string;
}) {
  return supabase
    .from('announcements')
    .insert([data])
    .select()
    .single();
}
export async function updateAnnouncement(
  id: string,
  data: {
    title?: string;
    description?: string;
    priority?: 'normal' | 'urgent';
    expires_at?: string;
  }
) {
  return supabase
    .from('announcements')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
}
export async function deleteAnnouncement(id: string) {
  return supabase
    .from('announcements')
    .delete()
    .eq('id', id);
}
