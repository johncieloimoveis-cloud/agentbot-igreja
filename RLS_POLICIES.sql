-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- AgentBot Igreja - Controle de Acesso
-- ============================================

-- 1. HABILITAR RLS NAS TABELAS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PEOPLE TABLE POLICIES
-- ============================================

-- Admin e Pastor: acesso total à sua igreja
CREATE POLICY people_admin_pastor
  ON people FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor')
    )
  );

-- Secretário: acesso total à sua igreja
CREATE POLICY people_secretary
  ON people FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'secretary'
  );

-- Líder de grupo: vê pessoas de seu grupo + subordinados
CREATE POLICY people_group_leader
  ON people FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'group_leader'
    AND (
      id IN (SELECT person_id FROM group_members WHERE group_id IN (
        SELECT id FROM groups WHERE leader_id = auth.uid()
      ))
      OR responsible_id = auth.uid()
    )
  );

-- Líder de ministério: vee pessoas de seu ministério + subordinados
CREATE POLICY people_ministry_leader
  ON people FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'ministry_leader'
    AND (
      id IN (SELECT person_id FROM ministry_members WHERE ministry_id IN (
        SELECT id FROM ministries WHERE leader_id = auth.uid()
      ))
      OR responsible_id = auth.uid()
    )
  );

-- ============================================
-- VISITORS TABLE POLICIES
-- ============================================

CREATE POLICY visitors_church_access
  ON visitors FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor', 'secretary')
  );

-- ============================================
-- GROUPS TABLE POLICIES
-- ============================================

CREATE POLICY groups_church_access
  ON groups FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor', 'secretary')
      OR leader_id = auth.uid()
    )
  );

-- ============================================
-- MINISTRIES TABLE POLICIES
-- ============================================

CREATE POLICY ministries_church_access
  ON ministries FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor', 'secretary')
      OR leader_id = auth.uid()
    )
  );

-- ============================================
-- ATTENDANCE_EVENTS TABLE POLICIES
-- ============================================

CREATE POLICY attendance_events_church_access
  ON attendance_events FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor', 'secretary')
  );

-- ============================================
-- TASKS TABLE POLICIES
-- ============================================

CREATE POLICY tasks_own_and_assigned
  ON tasks FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (
      responsible_id = auth.uid()
      OR assigned_to = auth.uid()
      OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor')
    )
  );

-- ============================================
-- ANNOUNCEMENTS TABLE POLICIES
-- ============================================

CREATE POLICY announcements_church_access
  ON announcements FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
  );

-- Apenas admin/pastor podem criar avisos
CREATE POLICY announcements_create
  ON announcements FOR INSERT
  WITH CHECK (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'pastor')
  );

-- Apenas criador pode editar/deletar
CREATE POLICY announcements_edit_delete
  ON announcements FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY announcements_delete
  ON announcements FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Cada usuário vê a si mesmo
CREATE POLICY users_see_self
  ON users FOR SELECT
  USING (id = auth.uid());

-- Admin vê todos da sua igreja
CREATE POLICY users_admin_see_all
  ON users FOR SELECT
  USING (
    church_id = auth.jwt() ->> 'church_id'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Substitua 'church_id' pelo ID real da sua igreja onde necessário
-- 2. Teste as policies antes de habilitar em produção
-- 3. RLS pode impactar performance - adicione índices necessários
-- 4. Mantenha backups antes de alterar policies
-- ============================================
