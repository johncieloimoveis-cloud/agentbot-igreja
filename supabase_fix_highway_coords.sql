-- Reseta TODOS os endereços de rodovia/km para reprocessamento.
-- A bounding box não é suficiente: coordenadas erradas podem cair dentro do Paraná
-- mas em cidade errada (ex: BR 153 km 124 em Ibaiti sendo colocado em Guarapuava).
-- Após rodar este script, execute novamente /admin/geocodificar.

UPDATE people
SET lat = NULL, lon = NULL, geocode_status = 'failed'
WHERE (
  address ILIKE '%br -%'
  OR address ILIKE '%br-%'
  OR address ILIKE '%br %'
  OR addr