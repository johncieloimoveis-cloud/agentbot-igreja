-- Adiciona campo de número separado do logradouro
-- Pessoas
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS address_number TEXT;

-- Grupos
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS meeting_address_number TEXT;

-- ─── Separação automática de dados existentes ─────────────────────────────
-- Tenta extrair o número do final do campo address (ex: "Rua das Flores, 123" ou "Rua das Flores 123")
-- Padrão aceito: número no final, precedido por vírgula+espaço ou só espaço
-- Revise manualmente após rodar — o script é conservador (só age quando há número claro no final)

UPDATE people
SET
  address_number = TRIM(REGEXP_REPLACE(address, '^.*?[,\s]+(\d+\s*[A-Za-z]?)$', '\1')),
  address        = TRIM(REGEXP_REPLACE(address, '[,\s]+\d+\s*[A-Za-z]?$', ''))
WHERE
  address IS NOT NULL
  AND address_number IS NULL
  AND address ~ '[,\s]\d+\s*[A-Za-z]?$';   -- termina em número (com letra opcional)

-- Mesma lógica para endereço de reunião dos grupos
UPDATE groups
SET
  meeting_address_number = TRIM(REGEXP_REPLACE(meeting_address, '^.*?[,\s]+(\d+\s*[A-Za-z]?)$', '\1')),
  meeting_address        = TRIM(REGEXP_REPLACE(meeting_address, '[,\s]+\d+\s*[A-Za-z]?$', ''))
WHERE
  meeting_address IS NOT NULL
  AND meeting_address_number IS NULL
  AND meeting_address ~ '[,\s]\d+\s*[A-Za-z]?$';
