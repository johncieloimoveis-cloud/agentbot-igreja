-- SheepCare Database Schema
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. TABELAS BASE
-- ============================================

CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(255),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador com acesso total'),
  ('pastor', 'Pastor ou liderança principal'),
  ('secretary', 'Secretária que cadastra e atualiza'),
  ('group_leader', 'Líder de GCEU ou pequeno grupo'),
  ('ministry_leader', 'Líder de ministério')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(church_id, email)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  constraint_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. TABELAS DE PESSOAS E RELACIONAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  photo_url VARCHAR(500),
  date_of_birth DATE,
  sex VARCHAR(1),
  marital_status VARCHAR(50),
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(255),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  profession VARCHAR(100),
  education_level VARCHAR(50),
  spouse_name VARCHAR(255),
  children_count INTEGER DEFAULT 0,
  responsible_id UUID REFERENCES people(id) ON DELETE SET NULL,
  first_contact_date DATE,
  how_met_church VARCHAR(255),
  status VARCHAR(50) DEFAULT 'visitor',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. GRUPOS (GCEUs/CÉLULAS)
-- ============================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  leader_id UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  vice_leader_id UUID REFERENCES people(id) ON DELETE SET NULL,
  meeting_address VARCHAR(255),
  meeting_day VARCHAR(20),
  meeting_time TIME,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  joined_date DATE DEFAULT CURRENT_DATE,
  is_visitor BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, person_id)
);

-- ============================================
-- 4. MINISTÉRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES people(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(department_id, person_id)
);

-- ============================================
-- 5. PRESENÇA
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50),
  event_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES attendance_events(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  attendance_date DATE,
  attended BOOLEAN DEFAULT false,
  notes VARCHAR(255),
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, person_id)
);

-- ============================================
-- 6. ACOMPANHAMENTO PASTORAL
-- ============================================

CREATE TABLE IF NOT EXISTS pastoral_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  followup_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  confidential BOOLEAN DEFAULT false,
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  request_date DATE DEFAULT CURRENT_DATE,
  is_urgent BOOLEAN DEFAULT false,
  is_confidential BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. TAREFAS
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50),
  responsible_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority VARCHAR(20) DEFAULT 'medium',
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- ============================================
-- 8. MENSAGENS WHATSAPP
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50),
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT
);

-- ============================================
-- 9. AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50)
);

-- ============================================
-- 10. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_people_name ON people(full_name);
CREATE INDEX IF NOT EXISTS idx_people_phone ON people(phone);
CREATE INDEX IF NOT EXISTS idx_people_whatsapp ON people(whatsapp);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
CREATE INDEX IF NOT EXISTS idx_people_church ON people(church_id);

CREATE INDEX IF NOT EXISTS idx_users_church ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_groups_church ON groups(church_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader ON groups(leader_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_person ON group_members(person_id);

CREATE INDEX IF NOT EXISTS idx_departments_church ON departments(church_id);
CREATE INDEX IF NOT EXISTS idx_departments_leader ON departments(leader_id);

CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_person ON attendance_records(person_id);

CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON tasks(responsible_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_church ON tasks(church_id);

CREATE INDEX IF NOT EXISTS idx_followups_person ON pastoral_followups(person_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON pastoral_followups(status);

CREATE INDEX IF NOT EXISTS idx_audit_church ON audit_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastoral_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users see their own church data
CREATE POLICY "Users see their church" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
  );

-- People: users see only people from their church
CREATE POLICY "Users see people from their church" ON people
  FOR SELECT USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert people in their church" ON people
  FOR INSERT WITH CHECK (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update people in their church" ON people
  FOR UPDATE USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
  );

-- Groups: users see only groups from their church
CREATE POLICY "Users see groups from their church" ON groups
  FOR SELECT USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
  );

-- Tasks: users see their own tasks and church admins see all
CREATE POLICY "Users see own and church tasks" ON tasks
  FOR SELECT USING (
    responsible_id = auth.uid() OR
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
  );

-- Pastoral followups: confidential only for authorized roles
CREATE POLICY "Users see appropriate followups" ON pastoral_followups
  FOR SELECT USING (
    NOT confidential OR
    (SELECT role_id FROM users WHERE id = auth.uid()) IN (
      SELECT id FROM roles WHERE name IN ('admin', 'pastor')
    )
  );

-- Audit logs: only admin
CREATE POLICY "Only admin sees audit logs" ON audit_logs
  FOR SELECT USING (
    (SELECT role_id FROM users WHERE id = auth.uid()) IN (
      SELECT id FROM roles WHERE name = 'admin'
    )
  );

-- ============================================
-- 12. FUNÇÕES E TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pastoral_followups_updated_at BEFORE UPDATE ON pastoral_followups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar audit log
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (church_id, user_id, action, resource, resource_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.church_id, OLD.church_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TO_JSONB(OLD),
    TO_JSONB(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar audit log em tabelas importantes
CREATE TRIGGER audit_people AFTER INSERT OR UPDATE OR DELETE ON people
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_pastoral_followups AFTER INSERT OR UPDATE OR DELETE ON pastoral_followups
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================
-- 13. DADOS INICIAIS OPCIONAIS
-- ============================================

-- Inserir uma chiesa de exemplo (comentado)
-- INSERT INTO churches (name, cnpj, email, city)
-- VALUES ('Igreja Exemplo', '12.345.678/0001-90', 'contato@igreja.com.br', 'São Paulo');
