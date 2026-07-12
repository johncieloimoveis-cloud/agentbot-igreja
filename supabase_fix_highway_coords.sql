-- Limpa coordenadas de pessoas cujo endereço contém rodovia/km
-- mas cujas coordenadas estão fora do Paraná (lat < -26.7 ou lat > -22.5 ou lon < -54 ou lon > -48)
-- Paraná fica entre lat -26.7 e -22.5, lon -54 e -48

UPDATE people
SET lat = NULL, lon = NULL, geocode_status = 'failed'
WHERE (
  address ILIKE '%br%' OR address ILIKE '%km%' OR address ILIKE '%rodovia%'
)
AND lat IS NOT NULL
AND (
  lat < -26.7 OR lat > -22.5
  OR lon < -54.0 OR lon > -48.0
);
