import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hasRoute(components: any[]): boolean {
  return components.some((c: any) => c.types.includes('route'));
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface GeoResult {
  lat: number;
  lon: number;
}

interface DiagInfo {
  query: string;
  status: string;
  location_type?: string;
  has_route?: boolean;
  city_found?: string;
  rejection?: string;
}

async function geocodeOne(
  address: string,
  city: string,
  key: string
): Promise<{ coords: GeoResult | null; diag: DiagInfo[] }> {
  const queries = address && city
    ? [`${address}, ${city}, Brasil`, `${city}, Brasil`]
    : address
    ? [`${address}, Brasil`]
    : [`${city}, Brasil`];

  const diag: DiagInfo[] = [];

  for (const q of queries) {
    const info: DiagInfo = { query: q, status: 'unknown' };
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=pt-BR&region=br`;
      const r = await fetch(url);
      const data = await r.json();
      info.status = data.status ?? 'no_status';

      if (data.status !== 'OK' || !data.results?.length) {
        info.rejection = `status=${data.status}`;
        diag.push(info);
        continue;
      }

      const result = data.results[0];
      const locType: string = result.geometry.location_type;
      const components: any[] = result.address_components ?? [];
      const route = hasRoute(components);

      info.location_type = locType;
      info.has_route = route;

      if (locType === 'APPROXIMATE') {
        info.rejection = 'APPROXIMATE rejected';
        diag.push(info);
        continue;
      }
      if (locType === 'GEOMETRIC_CENTER' && !route) {
        info.rejection = 'GEOMETRIC_CENTER without route rejected';
        diag.push(info);
        continue;
      }

      if (city) {
        const locality = components.find((c: any) =>
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        );
        if (locality) {
          info.city_found = locality.long_name;
          if (!norm(locality.long_name).includes(norm(city))) {
            info.rejection = `city mismatch: found "${locality.long_name}", expected "${city}"`;
            diag.push(info);
            continue;
          }
        }
      }

      const { lat, lng } = result.geometry.location;
      diag.push(info);
      return { coords: { lat, lon: lng }, diag };
    } catch (e: any) {
      info.status = 'exception';
      info.rejection = e?.message ?? 'unknown error';
      diag.push(info);
    }
  }
  return { coords: null, diag };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_MAPS_KEY nao configurada' });

  const { data: people, error } = await supabaseAdmin
    .from('people')
    .select('id, full_name, address, city')
    .eq('is_active', true)
    .not('address', 'is', null)
    .neq('address', '')
    .or('lat.is.null,geocode_status.eq.failed');

  if (error) return res.status(500).json({ error: error.message });
  if (!people?.length) return res.status(200).json({ processed: 0, message: 'Nenhuma pessoa sem coordenadas' });

  const results = {
    ok: 0,
    failed: 0,
    names_failed: [] as string[],
    sample_diag: null as any,  // diagnóstico das primeiras 3 falhas
    sample_diag_count: 0,
  };

  for (const person of people) {
    await new Promise((r) => setTimeout(r, 100));

    const { coords, diag } = await geocodeOne(person.address ?? '', person.city ?? '', key);

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

      // Guarda diagnóstico das primeiras 3 falhas
      if (results.sample_diag_count < 3) {
        if (!results.sample_diag) results.sample_diag = [];
        results.sample_diag.push({ person: person.full_name, address: person.address, city: person.city, diag });
        results.sample_diag_count++;
      }
    }
  }

  return res.status(200).json({
    processed: people.length,
    ok: results.ok,
    failed: results.failed,
    names_failed: results.names_failed,
    sample_diag: results.sample_diag,
  });
}
