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
  // Regra: apenas um grupo raiz por igreja
  if (!data.parent_group_id) {
    const { count } = await supabase
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .is('parent_group_id', null)
      .eq('status', 'active');

    if ((count ?? 0) > 0) {
      return {
        data: null,
        error: {
          message: 'Esta igreja ja possui um grupo raiz. Todo novo grupo deve ter um grupo pai.',
          code: 'ROOT_GROUP_EXISTS',
        },
      };
    }
  }

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
    .select('*, person:people(id, full_name, phone, whatsapp, status, date_of_birth, email)')
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
    .select('*, leader:people!leader_id(id, full_name), host:people!host_id(id, full_name, address, city, lat, lon)')
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
export const updateGroupMeeting = async (meetingId: string, data: any) => {
  return supabase
    .from('group_meetings')
    .update(data)
    .eq('id', meetingId)
    .select()
    .single();
};

export const getGroupsForMap = async (churchId: string) => {
  return supabase
    .from('groups')
    .select('id, name, meeting_city, lat, lon, host:people!host_id(lat, lon)')
    .eq('church_id', churchId)
    .eq('status', 'active');
};
