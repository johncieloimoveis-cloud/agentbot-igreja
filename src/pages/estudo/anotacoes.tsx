import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, BookMarked, Save, X } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Anotacao {
  id: string;
  titulo: string;
  conteudo: string;
  referencia: string;
  created_at: string;
}

export default function Anotacoes() {
  const { user } = useAuth();
  const [lista, setLista] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ titulo: '', referencia: '', conteudo: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('study_notes')
      .select('*')
      .order('created_at', { ascending: false });
    setLista(data || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!form.titulo.trim()) { setErro('Informe um título.'); return; }
    setSalvando(true);
    setErro('');
    const { error } = await supabase.from('study_notes').insert({
      titulo: form.titulo.trim(),
      referencia: form.referencia.trim() || null,
      conteudo: form.conteudo.trim() || null,
      user_id: user?.id,
    });
    if (error) {
      setErro(error.message);
    } else {
      setForm({ titulo: '', referencia: '', conteudo: '' });
      setCriando(false);
      carregar();
    }
    setSalvando(false);
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta anotação?')) return;
    await supabase.from('study_notes').delete().eq('id', id);
    setLista(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookMarked className="w-7 h-7 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anotações</h1>
        </div>
        <button
          onClick={() => { setCriando(true); setErro(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Anotação
        </button>
      </div>

      {/* Formulário de nova anotação */}
      {criando && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-primary-200 dark:border-primary-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Nova Anotação</h2>
            <button onClick={() => setCriando(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <input
            type="text"
            placeholder="Título *"
            value={form.titulo}
            onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Referência bíblica (ex: João 3:16)"
            value={form.referencia}
            onChange={e => setForm(p => ({ ...p, referencia: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            placeholder="Sua anotação..."
            value={form.conteudo}
            onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
            rows={5}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : lista.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma anotação ainda.</p>
          <p className="text-sm mt-1">Crie sua primeira anotação bíblica!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(a => (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{a.titulo}</h3>
                  {a.referencia && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">📖 {a.referencia}</span>
                  )}
                </div>
                <button
                  onClick={() => excluir(a.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {a.conteudo && (
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{a.conteudo}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
