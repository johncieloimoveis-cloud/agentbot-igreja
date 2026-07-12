import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Play, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface GeocodeResult {
  processed: number;
  ok: number;
  failed: number;
  names_failed: string[];
  message?: string;
}

export default function PeopleGeocodificar() {
  const router = useRouter();
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    setRunning(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/admin/batch-geocode', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm mb-6 inline-block"
        >
          Voltar
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Geocodificar Enderecos
            </h1>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Busca as coordenadas (latitude/longitude) de todas as pessoas que
            possuem endereco cadastrado mas ainda nao tem localizacao no mapa.
            Usa a API do Google Maps. Cada pessoa leva ~200ms.
          </p>

          <button
            onClick={run}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {running ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando... aguarde
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Iniciar Geocodificacao
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-3">
              {result.message ? (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 px-4 py-3 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {result.message}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-lg text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      <strong>{result.ok}</strong> de <strong>{result.processed}</strong> pessoas geocodificadas com sucesso
                    </span>
                  </div>

                  {result.failed > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                        <XCircle className="w-4 h-4" />
                        <strong>{result.failed}</strong> nao encontradas pelo Google Maps:
                      </div>
                      <ul className="list-disc list-inside text-amber-600 dark:text-amber-500 space-y-0.5">
                        {result.names_failed.map((name) => (
                          <li key={name} className="text-xs">{name}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                        Verifique se o endereco esta correto na ficha de cada pessoa.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
