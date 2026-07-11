import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy server-side para Google Maps Geocoding API.
// So aceita resultados precisos (rua/numero). Se o Google so resolve ate
// bairro ou municipio, retorna 404 — melhor nao plotar do que plotar errado.
const PRECISE = ['ROOFTOP', 'RANGE_INTERPOLATED'];

async function geocode(q: string, key: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=pt-BR&region=br`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.status !== 'OK' || !data.results?.length) return null;
  const result = data.results[0];
  if (!PRECISE.includes(result.geometry.location_type)) return null;
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
      const coords = await geocode(`${address}, ${city}, Brasil`, key);
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
