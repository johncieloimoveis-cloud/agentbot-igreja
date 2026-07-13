-- Adiciona coluna host_id (anfitrião) à tabela groups
-- Vincula um membro como anfitrião do grupo (para GCEU / grupos familiares)
-- O endereço do anfitrião é usado como sede do grupo no mapa

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES people(id);
