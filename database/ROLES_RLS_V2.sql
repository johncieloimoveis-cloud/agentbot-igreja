-- ================================================================
-- SHEEPCARE — RLS v2: Roles reais do sistema
-- Arcanjo: acesso total, indeletável
-- Querubim: tudo exceto itens comerciais (anúncios, planos)
-- Serafim:  líder de grupo — gerencia seu grupo, lê o restante
-- Anjinho:  membro — vê grupos dos quais faz parte
-- ================================================================
-- Execute em duas etapas no Supabase SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- ETAPA 1 — Funções e proteção do Arcanjo
-- ----------------------------------------------------------------

-- Garantir que a coluna role está com os valores corretos
UPDATE users u SET role = r.name FROM roles r WHERE r.id = u.role_id;

-- Garantir que o admin principal é Arcanjo
UPDATE users SET role = 'Arcanjo' WHERE email = 'johndeltavideo@gmail.com';

-- Recriar função de role (sem mudança necessária — já lê users.role)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT church_id FROM users WHERE id = auth.uid()
$$;

-- Proteção do Arcanjo: impede deleção de qualquer usuário com role Arcanjo
CREATE OR REPLACE FUNCTION protect_arcanjo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'Arcanjo' THEN
    RAISE EXCEPTION 'Usuário Arcanjo não pode ser removido do sistema.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_arcanjo_delete ON users;
CREATE TRIGGER prevent_arcanjo_delete
  BEFORE DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION protect_arcanjo();

-- ----------------------------------------------------------------
-- ETAPA 2 — Recriar todas as policies com os novos roles
-- ----------------------------------------------------------------

-- Limpar policies existentes
DROP POLICY IF EXISTS users_see_self        ON users;
DROP POLICY IF EXISTS users_see_church      ON users;
DROP POLICY IF EXISTS users_admin_see_all   ON users;
DROP POLICY IF EXISTS users_admin_manage    ON users;
DROP POLICY IF EXISTS users_manage          ON users;

DROP POLICY IF EXISTS people_read    ON people;
DROP POLICY IF EXISTS people_insert  ON people;
DROP POLICY IF EXISTS people_update  ON people;
DROP POLICY IF EXISTS people_delete  ON people;

DROP POLICY IF EXISTS groups_read    ON groups;
DROP POLICY IF EXISTS groups_insert  ON groups;
DROP POLICY IF EXISTS groups_write   ON groups;
DROP POLICY IF EXISTS groups_update  ON groups;
DROP POLICY IF EXISTS groups_delete  ON groups;

DROP POLICY IF EXISTS group_members_read  ON group_members;
DROP POLICY IF EXISTS group_members_write ON group_members;

DROP POLICY IF EXISTS departments_read  ON departments;
DROP POLICY IF EXISTS departments_write ON departments;

DROP POLICY IF EXISTS tasks_read  ON tasks;
DROP POLICY IF EXISTS tasks_write ON tasks;

DROP POLICY IF EXISTS attendance_events_read  ON attendance_events;
DROP POLICY IF EXISTS attendance_events_write ON attendance_events;

DROP POLICY IF EXISTS attendance_records_read  ON attendance_records;
DROP POLICY IF EXISTS attendance_records_write ON attendance_records;

DROP POLICY IF EXISTS pastoral_followups_read  ON pastoral_followups;
DROP POLICY IF EXISTS pastoral_followups_write ON pastoral_followups;

DROP POLICY IF EXISTS audit_logs_read ON audit_logs;

-- ================== USERS ==================
-- Cada usuário vê a si mesmo
CREATE POLICY users_see_self ON users
  FOR SELECT USING (id = auth.uid());

-- Arcanjo e Querubim veem todos da mesma igreja
CREATE POLICY users_see_church ON users
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

-- Somente Arcanjo gerencia usuários (o trigger impede deletar Arcanjo)
CREATE POLICY users_manage ON users
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'Arcanjo'
  );

-- ================== PEOPLE ==================
-- Arcanjo, Querubim e Serafim veem pessoas
CREATE POLICY people_read ON people
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim', 'Serafim')
  );

-- Arcanjo e Querubim criam e editam pessoas
CREATE POLICY people_insert ON people
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

CREATE POLICY people_update ON people
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

-- Somente Arcanjo deleta pessoas
CREATE POLICY people_delete ON people
  FOR DELETE USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'Arcanjo'
  );

-- ================== GROUPS ==================
-- Todos veem grupos da mesma igreja
CREATE POLICY groups_read ON groups
  FOR SELECT USING (church_id = get_my_church_id());

-- Arcanjo e Querubim criam grupos
CREATE POLICY groups_insert ON groups
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

-- Arcanjo, Querubim e Serafim editam grupos
CREATE POLICY groups_update ON groups
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim', 'Serafim')
  );

-- Somente Arcanjo deleta grupos
CREATE POLICY groups_delete ON groups
  FOR DELETE USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'Arcanjo'
  );

-- ================== GROUP_MEMBERS ==================
-- Todos da mesma igreja veem membros dos grupos
CREATE POLICY group_members_read ON group_members
  FOR SELECT USING (
    group_id IN (SELECT id FROM groups WHERE church_id = get_my_church_id())
  );

-- Arcanjo, Querubim e Serafim gerenciam membros
CREATE POLICY group_members_write ON group_members
  FOR ALL USING (
    group_id IN (SELECT id FROM groups WHERE church_id = get_my_church_id())
    AND get_my_role() IN ('Arcanjo', 'Querubim', 'Serafim')
  );

-- ================== DEPARTMENTS ==================
CREATE POLICY departments_read ON departments
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY departments_write ON departments
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

-- ================== TASKS ==================
CREATE POLICY tasks_read ON tasks
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (
      responsible_id = auth.uid()
      OR get_my_role() IN ('Arcanjo', 'Querubim')
    )
  );

CREATE POLICY tasks_write ON tasks
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

-- ================== ATTENDANCE ==================
CREATE POLICY attendance_events_read ON attendance_events
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY attendance_events_write ON attendance_events
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim', 'Serafim')
  );

CREATE POLICY attendance_records_read ON attendance_records
  FOR SELECT USING (
    event_id IN (SELECT id FROM attendance_events WHERE church_id = get_my_church_id())
  );

CREATE POLICY attendance_records_write ON attendance_records
  FOR ALL USING (
    event_id IN (SELECT id FROM attendance_events WHERE church_id = get_my_church_id())
    AND get_my_role() IN ('Arcanjo', 'Querubim', 'Serafim')
  );

-- ================== PASTORAL FOLLOWUPS ==================
CREATE POLICY pastoral_followups_read ON pastoral_followups
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (
      NOT confidential
      OR get_my_role() IN ('Arcanjo', 'Querubim')
    )
  );

CREATE POLICY pastoral_followups_write ON pastoral_followups
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('Arcanjo', 'Querubim')
  );

-- ================== AUDIT LOGS ==================
CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'Arcanjo'
  );

-- ================================================================
-- Fim do script
-- ================================================================
