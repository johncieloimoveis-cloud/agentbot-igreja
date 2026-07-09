-- SheepCare - Fase 4b: Politicas de ESCRITA (INSERT/UPDATE/DELETE)
-- Execute no Supabase SQL Editor
-- Idempotente: pode rodar quantas vezes quiser

-- people
DROP POLICY IF EXISTS "people_insert_own_church" ON public.people;
CREATE POLICY "people_insert_own_church" ON public.people
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "people_update_own_church" ON public.people;
CREATE POLICY "people_update_own_church" ON public.people
  FOR UPDATE TO authenticated
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "people_delete_own_church" ON public.people;
CREATE POLICY "people_delete_own_church" ON public.people
  FOR DELETE TO authenticated
  USING (church_id = get_my_church_id());

-- groups
DROP POLICY IF EXISTS "groups_insert_own_church" ON public.groups;
CREATE POLICY "groups_insert_own_church" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "groups_update_own_church" ON public.groups;
CREATE POLICY "groups_update_own_church" ON public.groups
  FOR UPDATE TO authenticated
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "groups_delete_own_church" ON public.groups;
CREATE POLICY "groups_delete_own_church" ON public.groups
  FOR DELETE TO authenticated
  USING (church_id = get_my_church_id());

-- group_members
DROP POLICY IF EXISTS "group_members_insert_own_church" ON public.group_members;
CREATE POLICY "group_members_insert_own_church" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT id FROM public.groups WHERE church_id = get_my_church_id())
  );

DROP POLICY IF EXISTS "group_members_update_own_church" ON public.group_members;
CREATE POLICY "group_members_update_own_church" ON public.group_members
  FOR UPDATE TO authenticated
  USING (group_id IN (SELECT id FROM public.groups WHERE church_id = get_my_church_id()));

DROP POLICY IF EXISTS "group_members_delete_own_church" ON public.group_members;
CREATE POLICY "group_members_delete_own_church" ON public.group_members
  FOR DELETE TO authenticated
  USING (group_id IN (SELECT id FROM public.groups WHERE church_id = get_my_church_id()));

-- departments
DROP POLICY IF EXISTS "departments_insert_own_church" ON public.departments;
CREATE POLICY "departments_insert_own_church" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "departments_update_own_church" ON public.departments;
CREATE POLICY "departments_update_own_church" ON public.departments
  FOR UPDATE TO authenticated
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "departments_delete_own_church" ON public.departments;
CREATE POLICY "departments_delete_own_church" ON public.departments
  FOR DELETE TO authenticated
  USING (church_id = get_my_church_id());

-- tasks
DROP POLICY IF EXISTS "tasks_insert_own_church" ON public.tasks;
CREATE POLICY "tasks_insert_own_church" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "tasks_update_own_church" ON public.tasks;
CREATE POLICY "tasks_update_own_church" ON public.tasks
  FOR UPDATE TO authenticated
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "tasks_delete_own_church" ON public.tasks;
CREATE POLICY "tasks_delete_own_church" ON public.tasks
  FOR DELETE TO authenticated
  USING (church_id = get_my_church_id());

-- recurring_events
DROP POLICY IF EXISTS "recurring_events_insert_own_church" ON public.recurring_events;
CREATE POLICY "recurring_events_insert_own_church" ON public.recurring_events
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "recurring_events_update_own_church" ON public.recurring_events;
CREATE POLICY "recurring_events_update_own_church" ON public.recurring_events
  FOR UPDATE TO authenticated
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "recurring_events_delete_own_church" ON public.recurring_events;
CREATE POLICY "recurring_events_delete_own_church" ON public.recurring_events
  FOR DELETE TO authenticated
  USING (church_id = get_my_church_id());

-- attendance_events
DROP POLICY IF EXISTS "attendance_events_insert_own_church" ON public.attendance_events;
CREATE POLICY "attendance_events_insert_own_church" ON public.attendance_events
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "attendance_events_update_own_church" ON public.attendance_events;
CREATE POLICY "attendance_events_update_own_church" ON public.attendance_events
  FOR UPDATE TO authenticated
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "attendance_events_delete_own_church" ON public.attendance_events;
CREATE POLICY "attendance_events_delete_own_church" ON public.attendance_events
  FOR DELETE TO authenticated
  USING (church_id = get_my_church_id());

-- attendance_records
DROP POLICY IF EXISTS "attendance_records_insert_own_church" ON public.attendance_records;
CREATE POLICY "attendance_records_insert_own_church" ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (SELECT id FROM public.attendance_events WHERE church_id = get_my_church_id())
  );

DROP POLICY IF EXISTS "attendance_records_update_own_church" ON public.attendance_records;
CREATE POLICY "attendance_records_update_own_church" ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (event_id IN (SELECT id FROM public.attendance_events WHERE church_id = get_my_church_id()));

DROP POLICY IF EXISTS "attendance_records_delete_own_church" ON public.attendance_records;
CREATE POLICY "attendance_records_delete_own_church" ON public.attendance_records
  FOR DELETE TO authenticated
  USING (event_id IN (SELECT id FROM public.attendance_events WHERE church_id = get_my_church_id()));

-- group_meetings (se existir)
DO $do$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_meetings') THEN
    DROP POLICY IF EXISTS "group_meetings_insert_own_church" ON public.group_meetings;
    CREATE POLICY "group_meetings_insert_own_church" ON public.group_meetings
      FOR INSERT TO authenticated
      WITH CHECK (group_id IN (SELECT id FROM public.groups WHERE church_id = get_my_church_id()));

    DROP POLICY IF EXISTS "group_meetings_delete_own_church" ON public.group_meetings;
    CREATE POLICY "group_meetings_delete_own_church" ON public.group_meetings
      FOR DELETE TO authenticated
      USING (group_id IN (SELECT id FROM public.groups WHERE church_id = get_my_church_id()));
  END IF;
END $do$;

-- department_members (se existir)
DO $do$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'department_members') THEN
    DROP POLICY IF EXISTS "department_members_insert_own_church" ON public.department_members;
    CREATE POLICY "department_members_insert_own_church" ON public.department_members
      FOR INSERT TO authenticated
      WITH CHECK (department_id IN (SELECT id FROM public.departments WHERE church_id = get_my_church_id()));

    DROP POLICY IF EXISTS "department_members_delete_own_church" ON public.department_members;
    CREATE POLICY "department_members_delete_own_church" ON public.department_members
      FOR DELETE TO authenticated
      USING (department_id IN (SELECT id FROM public.departments WHERE church_id = get_my_church_id()));
  END IF;
END $do$;
