import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy server-side para Google Maps Geocoding API.
// Aceita ROOFTOP e RANGE_INTERPOLATED sempre.
// Aceita GEOMETRIC_CENTER se tiver componente "route" OU se o endereco for de rodovia (BR/PR/km).
// Rejeita APPROXIMATE sempre.

function hasRoute(components: any[]): boolean {
  return components.some((c: any) => c.types.includes('route'));
}

// Detecta enderecos de rodovia: "BR 153", "PR-158", "Km 24", etc.
function isHighwayAddress(address: string): boolean {
  return /\b(br|pr|sp|mg|rs|sc|rj|ba|to|go|mt|ms)\s*[-–]?\s*\d+\b/i.test(address)
    || /\bkm\s*\d+/i.test(address)
    || /\brodovia\b/i.test(address);
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function geocode(q: string, key: string, expectedCity?: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=pt-BR&region=br`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.status !== 'OK' || !data.results?.length) return null;

  const result = data.results[0];
  const locType: string = result.geometry.location_type;
  const components: any[] = result.address_components ?? [];

  // Rejeita resultados de cidade/estado/pais
  if (locType === 'APPROXIMATE') return null;
  if (locType === 'GEOMETRIC_CENTER' && !hasRoute(components) && !isHighwayAddress(q)) return null;

  // Valida que o resultado esta na cidade esperada
  if (expectedCity) {
    const locality = components.find((c: any) =>
      c.types.includes('locality') || c.types.includes('administrative_area_level_2')
    );
    if (locality && !norm(locality.long_name).includes(norm(expectedCity))) {
      return null;
    }
  }

  const { lat, lng } = result.geometry.location;
  return { lat, lon: lng };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { address, city } = req.query as { address?: string; city?: string };
  if (!address && !city) return res.status(400).json({ error: 'address ou city obrigatorio' });

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_MAPS_KEY nao configurada' });

  try {
    if (address && city) {
      const coords = await geocode(`${address}, ${city}, Brasil`, key, city);
      if (coords) return res.status(200).json(coords);
    }

    if (address) {
      const coords = await geocode(`${address}, Brasil`, key);
      if (coords) return res.status(200).json(coords);
    }

    return res.status(404).json({ error: 'Endereco nao encontrado com precisao suficiente' });
  } catch (err) {
    console.error('Geocode error:', err);
    return res.status(500).json({ error: 'Erro ao geocodificar' });
  }
}
