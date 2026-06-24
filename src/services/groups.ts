import { supabase } from './supabase';
export const getGroups = async (churchId: string) => {
  return supabase
    .from('groups')
    .select('*, meetings:group_meetings(*)')
    .eq('church_id', churchId)
    .eq('status', 'active')
    .order('name');
};
export const createGroup = async (churchId: string, data: any) => {
  return supabase
    .from('groups')
    .insert({
      ...data,
      church_id: churchId,
      status: 'active',
    })
    .select()
    .single();
};
export const getGroupMembers = async (groupId: string) => {
  return supabase
    .from('group_members')
    .select('*, person:people(id, full_name, phone, whatsapp, status, date_of_birth)')
    .eq('group_id', groupId)
    .order('created_at');
};
export const addGroupMember = async (groupId: string, personId: string) => {
  return supabase
    .from('group_members')
    .insert({ group_id: groupId, person_id: personId })
    .select()
    .single();
};
export const removeGroupMember = async (membershipId: string) => {
  return supabase
    .from('group_members')
    .delete()
    .eq('id', membershipId);
};
export const getGroup = async (groupId: string) => {
  return supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();
};
export const updateGroup = async (groupId: string, data: any) => {
  return supabase
    .from('groups')
    .update(data)
    .eq('id', groupId)
    .select()
    .single();
};
export const deleteGroup = async (groupId: string) => {
  return supabase
    .from('groups')
    .update({ status: 'inactive' })
    .eq('id', groupId);
};
export const addGroupMeeting = async (groupId: string, meeting: any) => {
  return supabase
    .from('group_meetings')
    .insert({ group_id: groupId, ...meeting })
    .select()
    .single();
};
export const getGroupMeetings = async (groupId: string) => {
  return supabase
    .from('group_meetings')
    .select('*')
    .eq('group_id', groupId)
    .order('day_of_week');
};
export const deleteGroupMeeting = async (meetingId: string) => {
  return supabase
    .from('group_meetings')
    .delete()
    .eq('id', meetingId);
};