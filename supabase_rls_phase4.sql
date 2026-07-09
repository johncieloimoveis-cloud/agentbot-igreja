-- ════════════════════════════════════════════════════════════════
-- SHEEPCARE — Fase 4: RLS Multi-tenant
-- Execute no Supabase SQL Editor
-- Idempotente: pode rodar quantas vezes quiser sem efeito colateral
-- ════════════════════════════════════════════════════════════════

-- ── Helper: retorna o church_id do usuário autenticado ───────────
-- SECURITY DEFINER garante que a função lê users mesmo com RLS ativo
CREATE OR REPLACE FUNCTION public.get_my_church_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT church_id FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_my_church_id() TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- TABELAS COM church_id DIRETO
-- ════════════════════════════════════════════════════════════════

-- ── people ──────────────────────────────────────────────────────
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "people_select_own_church" ON public.people;
CREATE POLICY "people_select_own_church" ON public.people
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── groups ──────────────────────────────────────────────────────
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select_own_church" ON public.groups;
CREATE POLICY "groups_select_own_church" ON public.groups
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── departments ──────────────────────────────────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_select_own_church" ON public.departments;
CREATE POLICY "departments_select_own_church" ON public.departments
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── attendance_events ────────────────────────────────────────────
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_events_select_own_church" ON public.attendance_events;
CREATE POLICY "attendance_events_select_own_church" ON public.attendance_events
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── announcements ────────────────────────────────────────────────
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select_own_church" ON public.announcements;
CREATE POLICY "announcements_select_own_church" ON public.announcements
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── tasks ────────────────────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select_own_church" ON public.tasks;
CREATE POLICY "tasks_select_own_church" ON public.tasks
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── recurring_events (agenda) ────────────────────────────────────
ALTER TABLE public.recurring_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recurring_events_select_own_church" ON public.recurring_events;
CREATE POLICY "recurring_events_select_own_church" ON public.recurring_events
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ── churches ─────────────────────────────────────────────────────
-- Usuário vê apenas a própria igreja
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "churches_select_own" ON public.churches;
CREATE POLICY "churches_select_own" ON public.churches
  FOR SELECT TO authenticated
  USING (id = get_my_church_id());

-- ── users ────────────────────────────────────────────────────────
-- Vê apenas usuários da mesma igreja
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own_church" ON public.users;
CREATE POLICY "users_select_own_church" ON public.users
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

-- ════════════════════════════════════════════════════════════════
-- TABELAS DE JUNÇÃO (sem church_id direto — filtro via FK)
-- ════════════════════════════════════════════════════════════════

-- ── group_members ────────────────────────────────────────────────
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_members_select_own_church" ON public.group_members;
CREATE POLICY "group_members_select_own_church" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT id FROM public.groups WHERE church_id = get_my_church_id()
    )
  );

-- ── group_memberships (se existir — alias de group_members) ──────
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_memberships') THEN
    ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "group_memberships_select_own_church" ON public.group_memberships;
    CREATE POLICY "group_memberships_select_own_church" ON public.group_memberships
      FOR SELECT TO authenticated
      USING (
        group_id IN (
          SELECT id FROM public.groups WHERE church_id = get_my_church_id()
        )
      );
  END IF;
END $$;

-- ── group_meetings ───────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_meetings') THEN
    ALTER TABLE public.group_meetings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "group_meetings_select_own_church" ON public.group_meetings;
    CREATE POLICY "group_meetings_select_own_church" ON public.group_meetings
      FOR SELECT TO authenticated
      USING (
        group_id IN (
          SELECT id FROM public.groups WHERE church_id = get_my_church_id()
        )
      );
  END IF;
END $$;

-- ── department_members ───────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'department_members') THEN
    ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "department_members_select_own_church" ON public.department_members;
    CREATE POLICY "department_members_select_own_church" ON public.department_members
      FOR SELECT TO authenticated
      USING (
        department_id IN (
          SELECT id FROM public.departments WHERE church_id = get_my_church_id()
        )
      );
  END IF;
END $$;

-- ── attendance_records ───────────────────────────────────────────
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_records_select_own_church" ON public.attendance_records;
CREATE POLICY "attendance_records_select_own_church" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT id FROM public.attendance_events WHERE church_id = get_my_church_id()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- TABELAS GLOBAIS (sem church_id — leitura para todos autenticados)
-- ════════════════════════════════════════════════════════════════

-- ── roles ────────────────────────────────────────────────────────
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;
CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════════
-- NOTA: INSERT / UPDATE / DELETE não têm políticas de cliente
-- pois todas as mutações passam por API routes (service_role),
-- que bypassam o RLS por design. O withAuth middleware garante
-- autorização no nível da aplicação.
-- ════════════════════════════════════════════════════════════════
