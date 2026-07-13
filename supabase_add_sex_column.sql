-- Adiciona coluna sex à tabela people
-- Valores aceitos: 'M' (Masculino), 'F' (Feminino), ou NULL (não informado)

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS sex TEXT
  CHECK (sex IN ('M', 'F'));
