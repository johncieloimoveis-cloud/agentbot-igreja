-- ================================================================
-- SHEEPCARE — Configuração de Roles e RLS
-- Execute este script completo no Supabase SQL Editor
-- IMPORTANTE: rode ANTES do deploy do código
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Adicionar coluna role TEXT na tabela users (denormalizada)
--    Facilita queries e políticas RLS sem JOINs adicionais
-- ----------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;

-- Preencher com o nome do role atual de cada usuário
UPDATE users u
SET role = r.name
FROM roles r
WHERE r.id = u.role_id;

-- ----------------------------------------------------------------
-- 2. Funções helpers — SECURITY DEFINER para uso seguro em RLS
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM users WHERE id = auth.uid()
$$;

-- ----------------------------------------------------------------
-- 3. Limpar policies conflitantes ou mal formadas
-- ----------------------------------------------------------------

-- people
DROP POLICY IF EXISTS people_admin_pastor ON people;
DROP POLICY IF EXISTS people_secretary ON people;
DROP POLICY IF EXISTS people_group_leader ON people;
DROP POLICY IF EXISTS people_ministry_leader ON people;
DROP POLICY IF EXISTS "Users see people from their church" ON people;
DROP POLICY IF EXISTS "Users can insert people in their church" ON people;
DROP POLICY IF EXISTS "Users can update people in their church" ON people;
DROP POLICY IF EXISTS people_read ON people;
DROP POLICY IF EXISTS people_insert ON people;
DROP POLICY IF EXISTS people_update ON people;
DROP POLICY IF EXISTS people_delete ON people;

-- users
DROP POLICY IF EXISTS users_see_self ON users;
DROP POLICY IF EXISTS users_admin_see_all ON users;
DROP POLICY IF EXISTS "Users see their church" ON users;

-- groups
DROP POLICY IF EXISTS groups_church_access ON groups;
DROP POLICY IF EXISTS "Users see groups from their church" ON groups;
DROP POLICY IF EXISTS groups_read ON groups;
DROP POLICY IF EXISTS groups_write ON groups;

-- visitors
DROP POLICY IF EXISTS visitors_church_access ON visitors;

-- ministries
DROP POLICY IF EXISTS ministries_church_access ON ministries;

-- attendance_events
DROP POLICY IF EXISTS attendance_events_church_access ON attendance_events;

-- tasks
DROP POLICY IF EXISTS tasks_own_and_assigned ON tasks;
DROP POLICY IF EXISTS "Users see own and church tasks" ON tasks;

-- announcements
DROP POLICY IF EXISTS announcements_church_access ON announcements;
DROP POLICY IF EXISTS announcements_create ON announcements;
DROP POLICY IF EXISTS announcements_edit_delete ON announcements;
DROP POLICY IF EXISTS announcements_delete ON announcements;

-- audit_logs
DROP POLICY IF EXISTS "Only admin sees audit logs" ON audit_logs;

-- pastoral_followups
DROP POLICY IF EXISTS "Users see appropriate followups" ON pastoral_followups;

-- ----------------------------------------------------------------
-- 4. TABELA: users
-- ----------------------------------------------------------------
-- Cada usuário lê a si mesmo
CREATE POLICY users_see_self ON users
  FOR SELECT USING (id = auth.uid());

-- Admin lê todos da mesma igreja
CREATE POLICY users_admin_see_all ON users
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- Admin gerencia usuários da sua igreja
CREATE POLICY users_admin_manage ON users
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- ----------------------------------------------------------------
-- 5. TABELA: people
-- ----------------------------------------------------------------
-- Leitura: todos os usuários autenticados da mesma igreja
CREATE POLICY people_read ON people
  FOR SELECT USING (church_id = get_my_church_id());

-- Inserção: admin, pastor, secretário
CREATE POLICY people_insert ON people
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'secretary')
  );

-- Atualização: admin, pastor, secretário
CREATE POLICY people_update ON people
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'secretary')
  );

-- Exclusão: somente admin
CREATE POLICY people_delete ON people
  FOR DELETE USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- ----------------------------------------------------------------
-- 6. TABELA: groups
-- ----------------------------------------------------------------
-- Leitura: todos da mesma igreja (líderes de grupo também veem)
CREATE POLICY groups_read ON groups
  FOR SELECT USING (church_id = get_my_church_id());

-- Escrita: admin, pastor, secretário
CREATE POLICY groups_write ON groups
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'secretary')
  );

CREATE POLICY groups_update ON groups
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'secretary')
  );

CREATE POLICY groups_delete ON groups
  FOR DELETE USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- ----------------------------------------------------------------
-- 7. TABELA: group_members
-- ----------------------------------------------------------------
CREATE POLICY group_members_read ON group_members
  FOR SELECT USING (
    group_id IN (SELECT id FROM groups WHERE church_id = get_my_church_id())
  );

CREATE POLICY group_members_write ON group_members
  FOR ALL USING (
    group_id IN (SELECT id FROM groups WHERE church_id = get_my_church_id())
    AND get_my_role() IN ('admin', 'pastor', 'secretary', 'group_leader')
  );

-- ----------------------------------------------------------------
-- 8. TABELA: departments (ministérios)
-- ----------------------------------------------------------------
CREATE POLICY departments_read ON departments
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY departments_write ON departments
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

-- ----------------------------------------------------------------
-- 9. TABELA: tasks
-- ----------------------------------------------------------------
-- Cada usuário vê suas próprias tarefas; admin/pastor veem todas da igreja
CREATE POLICY tasks_read ON tasks
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (
      responsible_id = auth.uid()
      OR get_my_role() IN ('admin', 'pastor', 'secretary')
    )
  );

CREATE POLICY tasks_write ON tasks
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'secretary')
  );

-- ----------------------------------------------------------------
-- 10. TABELA: attendance_events
-- ----------------------------------------------------------------
CREATE POLICY attendance_events_read ON attendance_events
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY attendance_events_write ON attendance_events
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'secretary')
  );

-- ----------------------------------------------------------------
-- 11. TABELA: attendance_records
-- ----------------------------------------------------------------
CREATE POLICY attendance_records_read ON attendance_records
  FOR SELECT USING (
    event_id IN (SELECT id FROM attendance_events WHERE church_id = get_my_church_id())
  );

CREATE POLICY attendance_records_write ON attendance_records
  FOR ALL USING (
    event_id IN (SELECT id FROM attendance_events WHERE church_id = get_my_church_id())
    AND get_my_role() IN ('admin', 'pastor', 'secretary', 'group_leader')
  );

-- ----------------------------------------------------------------
-- 12. TABELA: pastoral_followups
-- ----------------------------------------------------------------
-- Registros confidenciais: somente admin e pastor
CREATE POLICY pastoral_followups_read ON pastoral_followups
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (
      NOT confidential
      OR get_my_role() IN ('admin', 'pastor')
    )
  );

CREATE POLICY pastoral_followups_write ON pastoral_followups
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

-- ----------------------------------------------------------------
-- 13. TABELA: audit_logs
-- ----------------------------------------------------------------
CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- ----------------------------------------------------------------
-- 14. TABELA: anuncios (acesso público para leitura do ticker/banner)
-- ----------------------------------------------------------------
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anuncios_public_read ON anuncios;
CREATE POLICY anuncios_public_read ON anuncios
  FOR SELECT USING (status = 'ativo');
-- Escrita: via service role no API (admin apenas, verificado no código)

-- ----------------------------------------------------------------
-- 15. TABELA: study_notes (notas de estudo)
-- ----------------------------------------------------------------
ALTER TABLE IF EXISTS study_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS study_notes_own ON study_notes;
CREATE POLICY study_notes_own ON study_notes
  FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 16. TABELA: devotionals
-- ----------------------------------------------------------------
ALTER TABLE IF EXISTS devotionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS devotionals_read ON devotionals;
DROP POLICY IF EXISTS devotionals_write ON devotionals;

CREATE POLICY devotionals_read ON devotionals
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY devotionals_write ON devotionals
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

-- ----------------------------------------------------------------
-- Fim do script
-- ----------------------------------------------------------------
