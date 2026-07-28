-- ============================================================
-- Task #91: Cadastro via IA — novos campos em people + config
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Novos campos na tabela people
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS estado_civil   TEXT,
  ADD COLUMN IF NOT EXISTS conjuge_nome   TEXT,
  ADD COLUMN IF NOT EXISTS data_casamento DATE,
  ADD COLUMN IF NOT EXISTS nacionalidade  TEXT DEFAULT 'Brasileiro(a)',
  ADD COLUMN IF NOT EXISTS naturalidade   TEXT,
  ADD COLUMN IF NOT EXISTS escolaridade   TEXT,
  ADD COLUMN IF NOT EXISTS profissao      TEXT,
  ADD COLUMN IF NOT EXISTS cpf            TEXT,
  ADD COLUMN IF NOT EXISTS data_conversao DATE,
  ADD COLUMN IF NOT EXISTS data_batismo   DATE;

-- Configuração de campos por igreja
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS cadastro_ia_campos JSONB DEFAULT '[]'::jsonb;

-- (Opcional) índice para buscas futuras por CPF
CREATE UNIQUE INDEX IF NOT EXISTS people_cpf_church_idx
  ON people (church_id, cpf)
  WHERE cpf IS NOT NULL AND cpf <> '';
