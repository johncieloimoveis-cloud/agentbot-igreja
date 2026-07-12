import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_MAPS_KEY nao configurada' });

  const q = (req.query.q as string) || 'Rua Amado Fortunato Heidgger, 18, Ibaiti, Brasil';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=pt-BR&region=br`;

  const r = await fetch(url);
  const data = await r.json();

  return res.status(200).json({
    query: q,
    status: data.status,
    error_message: data.error_message,
    results: (data.results ?? []).map((result: any) => ({
      formatted_address: result.formatted_address,
      location_type: result.geometry?.location_type,
      location: result.geometry?.location,
      types: result.types,
      address_components: result.address_components?.map((c: any) => ({
        long_name: c.long_name,
        types: c.types,
      })),
    })),
  });
}
