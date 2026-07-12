import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getGroups } from '@/services/groups';
import { MapPin, Users2, Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react';

interface GroupLocation {
  id: string;
  name: string;
  meeting_address: string | null;
  meeting_city: string | null;
  lat: number | null;
  lon: number | null;
  leader?: { full_name: string } | null;
}

export default function GroupsMapa() {
  const router = useRouter();
  const { user, church_id } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);

  const [groups, setGroups] = useState<GroupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { if (user && church_id) load(); }, [user, church_id]);
  useEffect(() => { if (!mapReady || !mapContainerRef.current) return; initMap(); }, [mapReady]);
  useEffect(() => { if (mapRef.current && groups.length > 0) plotMarkers(); }, [groups, mapReady]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await getGroups(church_id!);
      if (err) throw err;
      setGroups((data ?? []) as GroupLocation[]);
      await loadLeaflet();
      setMapReady(true);
    } catch { setError('Erro ao carregar dados.'); }
    finally { setLoading(false); }
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

    if (clusterRef.current) mapRef.current.removeLayer(clusterRef.current);

    const located = groups.filter((g) => g.lat && g.lon);
    if (located.length === 0) return;

    const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
    clusterRef.current = cluster;

    located.forEach((g, idx) => {
      // Cores alternadas para distinguir grupos
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
      const color = colors[idx % colors.length];

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;
          background:${color};
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,.4);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);font-size:13px;">👫</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const addr = [g.meeting_address, g.meeting_city].filter(Boolean).join(', ');
      const leader = (g as any).leader?.full_name ?? '';

      L.marker([g.lat!, g.lon!], { icon }).bindPopup(
        `<div style="min-width:200px;font-family:sans-serif">
          <strong style="font-size:14px;display:block;margin-bottom:4px">${g.name}</strong>
          ${addr ? `<span style="font-size:12px;color:#6b7280">📍 ${addr}</span><br/>` : ''}
          ${leader ? `<span style="font-size:12px;color:#6b7280">👤 Líder: ${leader}</span><br/>` : ''}
          <a href="/groups/${g.id}" style="font-size:12px;color:#2563eb;text-decoration:underline;margin-top:7px;display:inline-block">Abrir ficha</a>
        </div>`
      ).addTo(cluster);
    });

    mapRef.current.addLayer(cluster);
    const bounds = (L as any).latLngBounds(located.map((g) => [g.lat!, g.lon!]));
    mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  };

  const located = groups.filter((g) => g.lat && g.lon);
  const withoutCoords = groups.filter((g) => !g.lat || !g.lon);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
              Voltar
            </button>
            <div className="w-px h-5 bg-gray-300 dark:bg-slate-600" />
            <MapPin className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Mapa dos Grupos</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {!loading && (
          <div className="max-w-7xl mx-auto mt-3 flex flex-wrap items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users2 className="w-4 h-4" />
              <strong>{groups.length}</strong> grupos
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              <strong>{located.length}</strong> no mapa
            </span>
            {withoutCoords.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-500">
                <Info className="w-4 h-4" />
                <strong>{withoutCoords.length}</strong> sem coordenadas — abra a ficha e salve o endereço
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
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Carregando mapa...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />{error}
            </div>
          </div>
        )}
        {!loading && located.length === 0 && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-gray-500 dark:text-gray-400 max-w-sm px-4">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">Nenhum grupo com localização</p>
              <p className="text-sm">Abra a ficha de cada grupo, preencha o endereço e salve para aparecer aqui.</p>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} style={{ height: 'calc(100vh - 130px)', width: '100%' }} />
      </div>
    </div>
  );
}
