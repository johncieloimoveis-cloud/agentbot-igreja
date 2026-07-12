-- Adiciona campos de localização à tabela groups
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS meeting_city   varchar,
  ADD COLUMN IF NOT EXISTS lat            double precision,
  ADD COLUMN IF NOT EXISTS lon            double precision,
  ADD COLUMN IF NOT EXISTS geocode_status varchar DEFAULT NULL;

-- Índice para facilitar busca por grupos com coordenadas
CREATE INDEX IF NOT EXISTS idx_groups_lat_lon ON groups (lat, lon)
  WHERE lat IS NOT NULL AND lon IS NOT NULL;
