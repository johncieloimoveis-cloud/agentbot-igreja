-- ================================================================
-- PATCH: Serafim com escrita restrita aos próprios grupos
-- Rode no Supabase SQL Editor (sessão única)
-- ================================================================

-- Função helper: retorna os IDs dos grupos onde o usuário logado é membro
-- Usa email como elo entre users (auth) e people (membros)
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT gm.group_id
  FROM group_members gm
  INNER JOIN people p ON p.id = gm.person_id
  INNER JOIN users u ON lower(u.email) = lower(p.email)
  WHERE u.id = auth.uid()
$$;

-- ================== GROUPS — update ==================
-- Arcanjo e Querubim: qualquer grupo da igreja
-- Serafim: apenas grupos onde é membro
DROP POLICY IF EXISTS groups_update ON groups;
CREATE POLICY groups_update ON groups
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND (
      get_my_role() IN ('Arcanjo', 'Querubim')
      OR (get_my_role() = 'Serafim' AND id IN (SELECT get_my_group_ids()))
    )
  );

-- ================== GROUP_MEMBERS — escrita ==================
-- Arcanjo e Querubim: qualquer grupo da igreja
-- Serafim: apenas grupos onde é membro
DROP POLICY IF EXISTS group_members_write ON group_members;
CREATE POLICY group_members_write ON group_members
  FOR ALL USING (
    group_id IN (SELECT id FROM groups WHERE church_id = get_my_church_id())
    AND (
      get_my_role() IN ('Arcanjo', 'Querubim')
      OR (get_my_role() = 'Serafim' AND group_id IN (SELECT get_my_group_ids()))
    )
  )
  WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE church_id = get_my_church_id())
    AND (
      get_my_role() IN ('Arcanjo', 'Querubim')
      OR (get_my_role() = 'Serafim' AND group_id IN (SELECT get_my_group_ids()))
    )
  );

-- ================================================================
-- Fim do patch
-- ================================================================
