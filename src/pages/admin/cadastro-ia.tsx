import { useState, useEffect } from 'react';
import { Save, ChevronUp, ChevronDown, ToggleLeft, ToggleRight, Loader2, CheckCircle, Mic, ExternalLink } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface FieldDef {
  key: string;
  label: string;
  hint: string;
  required?: boolean;
}

interface FieldConfig extends FieldDef {
  active: boolean;
}

const MASTER_FIELDS: FieldDef[] = [
  { key: 'full_name',      label: 'Nome completo',      hint: 'Obrigatório', required: true },
  { key: 'date_of_birth',  label: 'Data de nascimento', hint: 'ex: 15/03/1990' },
  { key: 'sex',            label: 'Sexo',               hint: 'Masculino / Feminino' },
  { key: 'estado_civil',   label: 'Estado civil',       hint: 'Solteiro, Casado...' },
  { key: 'conjuge_nome',   label: 'Nome do cônjuge',    hint: 'Se casado(a)' },
  { key: 'data_casamento', label: 'Data do casamento',  hint: 'Se casado(a)' },
  { key: 'nacionalidade',  label: 'Nacionalidade',      hint: 'ex: Brasileiro(a)' },
  { key: 'naturalidade',   label: 'Cidade natal',       hint: 'ex: Campinas - SP' },
  { key: 'escolaridade',   label: 'Escolaridade',       hint: 'ex: Ensino médio' },
  { key: 'profissao',      label: 'Profissão',          hint: 'ex: Professor' },
  { key: 'cpf',            label: 'CPF',                hint: 'ex: 123.456.789-00' },
  { key: 'data_conversao', label: 'Data de conversão',  hint: 'ex: 03/2015' },
  { key: 'data_batismo',   label: 'Data de batismo',    hint: 'ex: 06/2015' },
  { key: 'email',          label: 'E-mail',             hint: 'ex: joao@gmail.com' },
  { key: 'phone',          label: 'Telefone',           hint: 'ex: 11 91234-5678' },
  { key: 'address',        label: 'Endereço (rua)',      hint: 'ex: Rua das Flores' },
  { key: 'address_number', label: 'Número',             hint: 'ex: 123' },
  { key: 'neighborhood',   label: 'Bairro',             hint: 'ex: Centro' },
  { key: 'city',           label: 'Cidade',             hint: 'ex: Campinas - SP' },
];

export default function CadastroIaAdmin() {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetchWithAuth('/api/admin/cadastro-ia-config')
      .then(r => r.json())
      .then(data => {
        setSlug(data.slug ?? '');
        const saved: { key: string; active: boolean }[] = data.campos ?? [];
        // Mescla master list com config salva
        const merged: FieldConfig[] = MASTER_FIELDS.map(f => {
          const found = saved.find(s => s.key === f.key);
          return { ...f, active: found ? found.active : (f.required ?? false) };
        });
        // Reordena conforme a ordem salva, mantendo os novos no final
        if (saved.length > 0) {
          const ordered: FieldConfig[] = [];
          saved.forEach(s => {
            const m = merged.find(f => f.key === s.key);
            if (m) ordered.push(m);
          });
          merged.forEach(f => {
            if (!ordered.find(o => o.key === f.key)) ordered.push(f);
          });
          setFields(ordered);
        } else {
          setFields(merged);
        }
        setLoading(false);
      })
      .catch(() => { setErro('Erro ao carregar configuração'); setLoading(false); });
  }, []);

  const toggle = (key: string) => {
    if (key === 'full_name') return; // obrigatório, não pode desativar
    setFields(prev => prev.map(f => f.key === key ? { ...f, active: !f.active } : f));
    setSaved(false);
  };

  const move = (idx: number, dir: -1 | 1) => {
    setFields(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErro('');
    try {
      const campos = fields.map(f => ({ key: f.key, active: f.active }));
      const r = await fetchWithAuth('/api/admin/cadastro-ia-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos }),
      });
      if (!r.ok) throw new Error('Erro ao salvar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErro('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro por IA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure quais campos a IA vai perguntar ao membro</p>
        </div>
      </div>

      {/* Acesso rápido ao chat */}
      {slug && (
        <a
          href={`/i/${slug}/cadastro-ia`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Abrir chat de cadastro por voz</p>
              <p className="text-xs text-green-600 dark:text-green-500">Use ao lado do novo membro para fazer o cadastro juntos</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        O membro acessa o link do portal da sua igreja, toca no botão de voz e conversa com a IA.
        Ela faz as perguntas selecionadas abaixo e salva as respostas automaticamente.
        Ative/desative campos e reordene conforme necessário.
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 text-red-700 dark:text-red-400 text-sm">
          {erro}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
        {fields.map((f, idx) => (
          <div key={f.key} className="flex items-center gap-3 px-4 py-3">
            {/* Reordenar */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-20 transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => move(idx, 1)}
                disabled={idx === fields.length - 1}
                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-20 transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggle(f.key)}
              className={`flex-shrink-0 transition-colors ${f.required ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              title={f.required ? 'Campo obrigatório' : f.active ? 'Desativar' : 'Ativar'}
            >
              {f.active
                ? <ToggleRight className="w-8 h-8 text-primary-500" />
                : <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-slate-500" />}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${f.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                {f.label}
                {f.required && <span className="ml-1 text-xs text-red-500">*obrigatório</span>}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{f.hint}</p>
            </div>

            {/* Índice de ordem (só ativos) */}
            {f.active && (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-bold flex items-center justify-center">
                {fields.slice(0, idx + 1).filter(x => x.active).length}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {fields.filter(f => f.active).length} campo(s) ativo(s)
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar configuração'}
        </button>
      </div>
    </div>
  );
}
