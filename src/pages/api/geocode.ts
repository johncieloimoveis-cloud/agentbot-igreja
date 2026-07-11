import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy server-side para Google Maps Geocoding API.
// A chave fica apenas no servidor — nunca exposta ao cliente.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { address, city } = req.query as { address?: string; city?: string };
  if (!address && !city) return res.status(400).json({ error: 'address ou city obrigatório' });

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_MAPS_KEY não configurada' });

  const q = [address, city, 'Brasil'].filter(Boolean).join(', ');
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=pt-BR&region=br`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return res.status(200).json({ lat, lon: lng });
    }

    // Fallback: só cidade
    if (city) {
      const r2 = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', Brasil')}&key=${key}&language=pt-BR&region=br`
      );
      const data2 = await r2.json();
      if (data2.status === 'OK' && data2.results?.length > 0) {
        const { lat, lng } = data2.results[0].geometry.location;
        return res.status(200).json({ lat, lon: lng });
      }
    }

    return res.status(404).json({ error: 'Endereço não encontrado' });
  } catch (err) {
    console.error('Geocode error:', err);
    return res.status(500).json({ error: 'Erro ao geocodificar' });
  }
}
