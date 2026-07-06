-- ================================================================
-- Trigger: mantém users.role (texto) sempre em sincronia com role_id
-- Rode no Supabase SQL Editor (sessão única)
-- ================================================================

CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT name INTO NEW.role FROM roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_role_on_update ON users;
CREATE TRIGGER sync_role_on_update
  BEFORE UPDATE OF role_id ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_role();

-- Sincronizar todos os usuários existentes agora
UPDATE users u SET role = r.name FROM roles r WHERE r.id = u.role_id;
