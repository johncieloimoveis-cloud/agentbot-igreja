import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRECISE_TYPES = ['ROOFTOP', 'RANGE_INTERPOLATED'];

function hasRoute(components: any[]): boolean {
  return components.some((c: any) => c.types.includes('route'));
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function geocodeOne(address: string, city: string, key: string): Promise<{ lat: number; lon: number } | null> {
  const queries = address && city
    ? [`${address}, ${city}, Brasil`, `${city}, Brasil`]
    : address
    ? [`${address}, Brasil`]
    : [`${city}, Brasil`];

  for (const q of queries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=pt-BR&region=br`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.status !== 'OK' || !data.results?.length) continue;

      const result = data.results[0];
      const locType: string = result.geometry.location_type;
      const components: any[] = result.address_components ?? [];

      if (locType === 'APPROXIMATE') continue;
      if (locType === 'GEOMETRIC_CENTER' && !hasRoute(components)) continue;

      // Valida cidade quando tiver
      if (city) {
        const locality = components.find((c: any) =>
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        );
        if (locality && !norm(locality.long_name).includes(norm(city))) continue;
      }

      const { lat, lng } = result.geometry.location;
      return { lat, lon: lng };
    } catch { continue; }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_MAPS_KEY nao configurada' });

  // Busca todas as pessoas com endereço mas sem coordenadas
  const { data: people, error } = await supabaseAdmin
    .from('people')
    .select('id, full_name, address, city')
    .eq('is_active', true)
    .not('address', 'is', null)
    .neq('address', '')
    .or('lat.is.null,geocode_status.eq.failed');

  if (error) return res.status(500).json({ error: error.message });
  if (!people?.length) return res.status(200).json({ processed: 0, message: 'Nenhuma pessoa sem coordenadas' });

  const results = { ok: 0, failed: 0, names_failed: [] as string[] };

  for (const person of people) {
    // Pausa de 200ms entre chamadas para respeitar rate limit da API
    await new Promise((r) => setTimeout(r, 200));

    const coords = await geocodeOne(person.address ?? '', person.city ?? '', key);
    if (coords) {
      await supabaseAdmin
        .from('people')
        .update({ lat: coords.lat, lon: coords.lon, geocode_status: 'ok' })
        .eq('id', person.id);
      results.ok++;
    } else {
      await supabaseAdmin
        .from('people')
        .update({ lat: null, lon: null, geocode_status: 'failed' })
        .eq('id', person.id);
      results.failed++;
      results.names_failed.push(person.full_name);
    }
  }

  return res.status(200).json({
    processed: people.length,
    ...results,
  });
}
