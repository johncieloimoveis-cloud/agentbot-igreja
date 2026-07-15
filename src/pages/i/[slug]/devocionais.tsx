import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { PublicLayout } from '@/components/PublicLayout';

interface Devocional {
  id: string;
  titulo: string;
  conteudo: string;
  escritura: string;
  data: string;
}

export default function PublicDevocionais() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const [lista, setLista] = useState<Devocional[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('devotionals')
      .select('id, titulo, escritura, conteudo, data')
      .order('data', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setLista(data || []);
        setLoading(false);
      });
  }, []);

  const hoje = new Date().toISOString().split('T')[0];
  const devocionalHoje = lista.find(d => d.data === hoje);

  if (!slug) return null;

  return (
    <PublicLayout slug={slug}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devocionais</h1>
        </div>

        {devocionalHoje && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Devocional de Hoje</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{devocionalHoje.titulo}</h2>
            {devocionalHoje.escritura && (
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3">- {devocionalHoje.escritura}</p>
            )}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{devocionalHoje.conteudo}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-16">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum devocional publicado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(d => (
              <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setExpandido(expandido === d.id ? null : d.id)}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{d.titulo}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {d.escritura && <span className="text-xs text-primary-600 dark:text-primary-400">- {d.escritura}</span>}
                      <span className="text-xs text-gray-400">
                        {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {expandido === d.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  }
                </button>
                {expandido === d.id && (
                  <div className="px-5 pb-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-100 dark:border-slate-700 pt-4">
                    {d.conteudo}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
