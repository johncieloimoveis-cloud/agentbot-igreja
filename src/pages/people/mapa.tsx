import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getPeopleWithAddress } from '@/services/people';
import { MapPin, Users, Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react';

interface PersonLocation {
  id: string;
  full_name: string;
  address: string;
  city: string;
  status: string;
  lat: number | null;
  lon: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  active_member:    '#22c55e',
  visitor:          '#3b82f6',
  eventual:         '#f59e0b',
  new_convert:      '#06b6d4',
  in_discipleship:  '#8b5cf6',
  absent:           '#ef4444',
  transferred:      '#ec4899',
};
const STATUS_LABELS: Record<string, string> = {
  active_member:    'Membro Ativo',
  visitor:          'Visitante',
  eventual:         'Eventual',
  new_convert:      'Novo Convertido',
  in_discipleship:  'Em Discipulado',
  absent:           'Afastado',
  transferred:      'Transferido',
};
const DEFAULT_COLOR = '#6b7280';

export default function PeopleMapa() {
  const router = useRouter();
  const { user, church_id } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);

  const [people, setPeople] = useState<PersonLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (user && church_id) load();
  }, [user, church_id]);

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current) return;
    initMap();
  }, [mapReady]);

  useEffect(() => {
    if (mapRef.current && people.length > 0) plotMarkers();
  }, [people, mapReady]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await getPeopleWithAddress(church_id!);
      if (err) throw err;
      setPeople((data ?? []) as PersonLocation[]);
      await loadLeaflet();
      setMapReady(true);
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaflet = async () => {
    if ((window as any).L) return;
    const loadScript = (src: string) => new Promise<void>((res) => {
      const s = document.createElement('script'); s.src = src; s.onload = () => res();
      document.head.appendChild(s);
    });
    const loadCSS = (href: string) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    };
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    await loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
    loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
    loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');
  };

  const initMap = () => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView([-23.5, -51.0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
  };

  const plotMarkers = () => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    if (clusterRef.current) {
      mapRef.current.removeLayer(clusterRef.current);
    }

    const located = people.filter((p) => p.lat && p.lon);
    if (located.length === 0) return;

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 30,
      disableClusteringAtZoom: 16,
    });
    clusterRef.current = cluster;

    located.forEach((p) => {
      const color = STATUS_COLORS[p.status] ?? DEFAULT_COLOR;
      const label = STATUS_LABELS[p.status] ?? p.status;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.45);cursor:pointer"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([p.lat!, p.lon!], { icon }).bindPopup(
        `<div style="min-width:180px;font-family:sans-serif">
          <strong style="font-size:14px;display:block;margin-bottom:4px">${p.full_name}</strong>
          <span style="font-size:12px;color:#6b7280">${p.address}${p.city ? `, ${p.city}` : ''}</span><br/>
          <span style="font-size:11px;background:${color};color:white;padding:1px 8px;border-radius:9999px;display:inline-block;margin-top:5px">${label}</span><br/>
          <a href="/people/${p.id}" style="font-size:12px;color:#2563eb;text-decoration:underline;margin-top:7px;display:inline-block">Abrir ficha</a>
        </div>`
      ).addTo(cluster);
    });

    mapRef.current.addLayer(cluster);

    const bounds = (L as any).latLngBounds(located.map((p) => [p.lat!, p.lon!]));
    mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  };

  const located = people.filter((p) => p.lat && p.lon);
  const withoutCoords = people.filter((p) => !p.lat || !p.lon);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Cabecalho */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm">
              Voltar
            </button>
            <div className="w-px h-5 bg-gray-300 dark:bg-slate-600" />
            <MapPin className="w-5 h-5 text-emerald-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Mapa da Congregacao</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                  {STATUS_LABELS[status] ?? status}
                </span>
              ))}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {!loading && (
          <div className="max-w-7xl mx-auto mt-3 flex flex-wrap items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <strong>{people.length}</strong> com endereco
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              <strong>{located.length}</strong> no mapa
            </span>
            {withoutCoords.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-500">
                <Info className="w-4 h-4" />
                <strong>{withoutCoords.length}</strong> sem coordenadas — abra a ficha e salve para aparecerem
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-slate-900 z-10">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Carregando mapa...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}
        {!loading && located.length === 0 && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-gray-500 dark:text-gray-400 max-w-sm px-4">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">Nenhuma localizacao disponivel</p>
              <p className="text-sm">
                {people.length > 0
                  ? `${people.length} pessoa(s) com endereco mas sem coordenadas. Abra cada ficha e salve para gerar as coordenadas.`
                  : 'Cadastre enderecos nas fichas individuais para eles aparecerem aqui.'}
              </p>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} style={{ height: 'calc(100vh - 130px)', width: '100%' }} />
      </div>
    </div>
  );
}
