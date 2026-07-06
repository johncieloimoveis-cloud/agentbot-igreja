import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Megaphone, Clock, PlusCircle, X, Save, Pencil, Star } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface Anuncio {
  id: string;
  empresa: string;
  mensagem: string;
  contato: string | null;
  status: 'pendente' | 'ativo' | 'inativo';
  destaque: boolean;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ativo:    { label: 'Ativo',    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  inativo:  { label: 'Inativo',  color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400' },
};

export default function AdminAnuncios() {
  const [lista, setLista] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'ativo' | 'inativo'>('todos');
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ empresa: '', mensagem: '', contato: '', status: 'ativo' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ empresa: '', mensagem: '', contato: '', status: 'ativo' });
  const [erroEdit, setErroEdit] = useState('');
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const res = await fetchWithAuth('/api/admin/anuncios');
    const data = await res.json();
    setLista(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!form.empresa.trim() || !form.mensagem.trim()) { setErro('Empresa e mensagem são obrigatórios.'); return; }
    setSalvando(true);
    setErro('');
    const res = await fetchWithAuth('/api/admin/anuncios', {
      method: 'POST',

      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.error || 'Erro ao salvar'); setSalvando(false); return; }
    setForm({ empresa: '', mensagem: '', contato: '', status: 'ativo' });
    setCriando(false);
    carregar();
    setSalvando(false);
  };

  const abrirEdicao = (a: Anuncio) => {
    setEditandoId(a.id);
    setEditForm({ empresa: a.empresa, mensagem: a.mensagem, contato: a.contato || '', status: a.status });
    setErroEdit('');
  };

  const salvarEdicao = async () => {
    if (!editForm.empresa.trim() || !editForm.mensagem.trim()) { setErroEdit('Empresa e mensagem são obrigatórios.'); return; }
    setSalvandoEdit(true);
    setErroEdit('');
    const res = await fetchWithAuth('/api/admin/anuncios', {
      method: 'PATCH',

      body: JSON.stringify({ id: editandoId, ...editForm }),
    });
    const data = await res.json();
    if (!res.ok) { setErroEdit(data.error || 'Erro ao salvar'); setSalvandoEdit(false); return; }
    setLista(prev => prev.map(a => a.id === editandoId ? { ...a, ...editForm, status: editForm.status as any } : a));
    setEditandoId(null);
    setSalvandoEdit(false);
  };

  const atualizar = async (id: string, status: string) => {
    const res = await fetchWithAuth('/api/admin/anuncios', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setLista(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    }
  };

  const toggleDestaque = async (a: Anuncio) => {
    const novoDestaque = !a.destaque;
    const res = await fetchWithAuth('/api/admin/anuncios', {
      method: 'PATCH',
      body: JSON.stringify({ id: a.id, destaque: novoDestaque }),
    });
    if (res.ok) {
      setLista(prev => prev.map(x => x.id === a.id ? { ...x, destaque: novoDestaque } : x));
    }
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir este anúncio?')) return;
    const res = await fetchWithAuth('/api/admin/anuncios', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setLista(prev => prev.filter(a => a.id !== id));
    }
  };

  const filtrados = filtro === 'todos' ? lista : lista.filter(a => a.status === filtro);
  const pendentes = lista.filter(a => a.status === 'pendente').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anúncios</h1>
            {pendentes > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                {pendentes} aguardando aprovação
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => { setCriando(true); setErro(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Anúncio
        </button>
      </div>

      {/* Formulário inline */}
      {criando && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-primary-200 dark:border-primary-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Novo Anúncio</h2>
            <button onClick={() => setCriando(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text" placeholder="Nome da empresa *"
              value={form.empresa} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text" placeholder="Mensagem do anúncio *" maxLength={120}
              value={form.mensagem} onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-3">
              <input
                type="text" placeholder="Contato (opcional)"
                value={form.contato} onChange={e => setForm(p => ({ ...p, contato: e.target.value }))}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ativo">Ativo</option>
                <option value="pendente">Pendente</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <button
            onClick={salvar} disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Publicar Anúncio'}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'pendente', 'ativo', 'inativo'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filtro === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {f === 'todos' ? 'Todos' : STATUS_LABEL[f].label}
            {f !== 'todos' && (
              <span className="ml-1.5 opacity-70">({lista.filter(a => a.status === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum anúncio encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(a => (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
              {editandoId === a.id ? (
                /* Formulário de edição inline */
                <div className="space-y-3 w-full">
                  {erroEdit && <p className="text-red-500 text-sm">{erroEdit}</p>}
                  <input
                    type="text" placeholder="Nome da empresa *"
                    value={editForm.empresa} onChange={e => setEditForm(p => ({ ...p, empresa: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text" placeholder="Mensagem *" maxLength={120}
                    value={editForm.mensagem} onChange={e => setEditForm(p => ({ ...p, mensagem: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text" placeholder="Contato (opcional)"
                      value={editForm.contato} onChange={e => setEditForm(p => ({ ...p, contato: e.target.value }))}
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <select
                      value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                      className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="pendente">Pendente</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={salvarEdicao} disabled={salvandoEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                      <Save className="w-4 h-4" />{salvandoEdit ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditandoId(null)}
                      className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">🏪 {a.empresa}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[a.status].color}`}>
                        {STATUS_LABEL[a.status].label}
                      </span>
                      {a.destaque && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Destaque
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{a.mensagem}</p>
                    {a.contato && <p className="text-xs text-gray-400 mt-1">📞 {a.contato}</p>}
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleDestaque(a)}
                      title={a.destaque ? 'Remover destaque' : 'Marcar como destaque (banner)'}
                      className={`p-2 rounded-lg transition-colors ${
                        a.destaque
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${a.destaque ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => abrirEdicao(a)} title="Editar"
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {a.status === 'pendente' && (
                      <button onClick={() => atualizar(a.id, 'ativo')} title="Aprovar"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {a.status === 'ativo' && (
                      <button onClick={() => atualizar(a.id, 'inativo')} title="Desativar"
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    {a.status === 'inativo' && (
                      <button onClick={() => atualizar(a.id, 'ativo')} title="Reativar"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => excluir(a.id)} title="Excluir"
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
