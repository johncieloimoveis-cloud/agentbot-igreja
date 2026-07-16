import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Clock, UserCheck, UserX, Phone, Mail, RefreshCw, Copy, MessageSquare, X, Send, Check } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

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

  // Para a mensagem precisamos sempre da lista de atualizados
  const [atualizados, setAtualizados] = useState<Pessoa[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [msgCopiada, setMsgCopiada] = useState(false);
  const [marcando, setMarcando] = useState<string | null>(null);

  const carregar = async (a: Aba) => {
    setLoading(true);
    const res = await fetchWithAuth(`/api/admin/cadastros?aba=${a}`);
    const data = await res.json();
    setLista(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  // Mantém atualizados sempre em cache (necessário para gerar mensagem)
  const carregarAtualizados = useCallback(async () => {
    const res = await fetchWithAuth('/api/admin/cadastros?aba=atualizados');
    const data = await res.json();
    setAtualizados(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { carregar(aba); }, [aba]);
  useEffect(() => { carregarAtualizados(); }, [carregarAtualizados]);
  // Sincroniza cache quando aba ativa for atualizados
  useEffect(() => { if (aba === 'atualizados') setAtualizados(lista); }, [aba, lista]);

  const contato = (p: Pessoa) => p.whatsapp || p.phone || p.email || '';

  const copiarLista = () => {
    const texto = lista.map(p => `${p.full_name} — ${contato(p)}`).join('\n');
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

  const gerarMensagem = () => {
    const nomes = atualizados.map(p => p.full_name).join('\n');
    const total = atualizados.length;
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}/cadastro`
      : 'https://agentbot-igreja.vercel.app/cadastro';

    return `A paz do SENHOR, irmãos.
Estamos passando aqui para agradecer aos ${total} irmão${total !== 1 ? 's' : ''} que já atualizaram seus cadastros:
${nomes}

Aos irmãos que ainda não atualizaram, peço, por gentileza, que reservem apenas *1 minutinho* para fazê-lo. A atualização é simples, rápida e nos ajudará muito a manter os dados da igreja sempre corretos.

Acessem o link:
👉 ${link}

Que Deus abençoe a todos! 🙏`;
  };

  const marcarAtualizado = async (p: Pessoa) => {
    if (!confirm('Marcar "' + p.full_name + '" como cadastro atualizado?')) return;
    setMarcando(p.id);
    try {
      const res = await fetchWithAuth('/api/admin/cadastros', {
        method: 'PATCH',
        body: JSON.stringify({ id: p.id }),
      });
      if (res.ok) {
        setLista(l => l.filter(x => x.id !== p.id));
      }
    } finally {
      setMarcando(null);
    }
  };

  const gerarMsgIndividual = (p: Pessoa) => {
    const nome = p.full_name.split(' ')[0]; // primeiro nome
    return `Irmão(a) ${nome}, a paz do SENHOR. Ajude-me a atualizar o cadastro de irmãos da igreja. Informe os seguintes dados:\n\nNome completo;\nData de Nascimento;\nEndereço.\n\nQue Deus abençoe sua vida`;
  };

  const abrirWhatsapp = (p: Pessoa) => {
    const fone = (p.whatsapp || p.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(gerarMsgIndividual(p));
    if (fone) {
      const numero = fone.startsWith('55') ? fone : '55' + fone;
      window.open('https://wa.me/' + numero + '?text=' + msg, '_blank');
    } else {
      navigator.clipboard.writeText(gerarMsgIndividual(p));
    }
  };

  const copiarMensagem = () => {
    navigator.clipboard.writeText(gerarMensagem()).then(() => {
      setMsgCopiada(true);
      setTimeout(() => setMsgCopiada(false), 2000);
    });
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
          <button
            onClick={() => setModalAberto(true)}
            title="Gerar mensagem para o grupo"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Mensagem grupo
          </button>
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
            onClick={() => { carregar(aba); carregarAtualizados(); }}
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
              {aba === 'atualizados' && p.cadastro_atualizado_em && (
                <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatarData(p.cadastro_atualizado_em)}
                </div>
              )}
              {aba === 'pendentes' && (
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => abrirWhatsapp(p)}
                    title={(p.whatsapp || p.phone) ? 'Enviar mensagem no WhatsApp' : 'Copiar mensagem (sem telefone cadastrado)'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      (p.whatsapp || p.phone)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {(p.whatsapp || p.phone) ? 'WhatsApp' : 'Copiar msg'}
                  </button>
                  <button
                    onClick={() => marcarAtualizado(p)}
                    disabled={marcando === p.id}
                    title="Marcar manualmente como atualizado"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {marcando === p.id ? '...' : 'OK'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de mensagem */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">Mensagem para o grupo</h2>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 font-sans leading-relaxed max-h-80 overflow-y-auto border border-gray-200 dark:border-slate-700">
                {gerarMensagem()}
              </pre>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={copiarMensagem}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                {msgCopiada ? 'Copiado!' : 'Copiar mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
