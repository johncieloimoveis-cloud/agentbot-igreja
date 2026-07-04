import { useState, useEffect } from 'react';
import { ClipboardCheck, Clock, UserCheck, UserX, Phone, Mail, RefreshCw, Copy } from 'lucide-react';

interface Pessoa {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  cadastro_atualizado_em: string | null;
}

type Aba = 'atualizados' | 'pendentes';

export default function AdminCadastros() {
  const [aba, setAba] = useState<Aba>('pendentes');
  const [lista, setLista] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const carregar = async (a: Aba) => {
    setLoading(true);
    const res = await fetch(`/api/admin/cadastros?aba=${a}`);
    const data = await res.json();
    setLista(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { carregar(aba); }, [aba]);

  const contato = (p: Pessoa) => p.whatsapp || p.phone || p.email || '—';

  const copiarLista = () => {
    const texto = lista
      .map(p => `${p.full_name} — ${contato(p)}`)
      .join('\n');
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-teal-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastros</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acompanhe quem atualizou os dados pelo formulário público.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lista.length > 0 && (
            <button
              onClick={copiarLista}
              title="Copiar lista"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          )}
          <button
            onClick={() => carregar(aba)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        <button
          onClick={() => setAba('pendentes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            aba === 'pendentes'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          <UserX className="w-4 h-4" />
          Não atualizaram
        </button>
        <button
          onClick={() => setAba('atualizados')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            aba === 'atualizados'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Atualizaram
        </button>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lista.length === 0
            ? 'Nenhum registro encontrado.'
            : `${lista.length} pessoa${lista.length > 1 ? 's' : ''}`}
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : lista.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          {aba === 'pendentes' ? (
            <>
              <UserCheck className="w-12 h-12 mx-auto mb-3 text-teal-400 opacity-60" />
              <p>Todos já atualizaram o cadastro!</p>
            </>
          ) : (
            <>
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum cadastro atualizado ainda.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(p => (
            <div
              key={p.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border px-5 py-4 shadow-sm flex items-center justify-between gap-4 ${
                aba === 'atualizados'
                  ? 'border-teal-100 dark:border-teal-900/40'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              {/* Nome + contato */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{p.full_name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {(p.whatsapp || p.phone) && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Phone className="w-3 h-3" />
                      {p.whatsapp || p.phone}
                    </span>
                  )}
                  {p.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      {p.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Data de atualização (aba atualizados) */}
              {aba === 'atualizados' && p.cadastro_atualizado_em && (
                <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatarData(p.cadastro_atualizado_em)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
