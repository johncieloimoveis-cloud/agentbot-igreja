import { useState } from 'react';
import { CheckCircle, ChevronDown, Search, UserCheck, UserPlus } from 'lucide-react';

const POSICOES = [
  'NÃO',
  'Pastor(a)',
  'Aspirante(a)',
  'Presbítero(a)',
  'Diácono(isa)',
  'Missionário(a)',
  'Secretário(a)',
];

type Step = 'phone' | 'form' | 'done';

interface FormData {
  full_name: string;
  email: string;
  oficial: string;
  date_of_birth: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
}

const EMPTY_FORM: FormData = {
  full_name: '',
  email: '',
  oficial: 'NÃO',
  date_of_birth: '',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
};

export default function Cadastro() {
  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Pessoa encontrada no banco
  const [foundId, setFoundId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  /* ── Passo 1: busca por telefone ── */
  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setSearching(true);
    setSearchError('');

    try {
      const res = await fetch(`/api/public/find-person?phone=${encodeURIComponent(phoneInput.trim())}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao buscar');

      if (data.person) {
        setFoundId(data.person.id);
        setForm({
          full_name: data.person.full_name || '',
          email: data.person.email || '',
          oficial: data.person.oficial || 'NÃO',
          date_of_birth: data.person.date_of_birth || '',
          address: data.person.address || '',
          city: data.person.city || '',
          phone: data.person.phone || phoneInput.trim(),
          whatsapp: data.person.whatsapp || '',
        });
      } else {
        setFoundId(null);
        setForm({ ...EMPTY_FORM, phone: phoneInput.trim() });
      }

      setStep('form');
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao buscar. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  /* ── Passo 2: submit do formulário ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.full_name.trim()) {
      setFormError('Por favor, informe seu nome completo.');
      return;
    }

    setLoading(true);
    try {
      const method = foundId ? 'PATCH' : 'POST';
      const body = foundId ? { ...form, id: foundId } : form;

      const res = await fetch('/api/public/register', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');
      setStep('done');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Tela de confirmação ── */
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {foundId ? 'Cadastro atualizado!' : 'Cadastro enviado!'}
          </h2>
          <p className="text-gray-400">
            {foundId
              ? 'Suas informações foram atualizadas com sucesso.'
              : 'Obrigado! Suas informações foram recebidas com sucesso.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <img src="/lobot-logo.svg" alt="Logo" className="w-16 h-16 rounded-lg mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Atualização de Cadastro</h1>
            <p className="text-gray-400 text-sm mt-2">
              Mantenha seus dados atualizados na nossa família.
            </p>
          </div>

          {/* ── PASSO 1: Celular ── */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSearch} className="space-y-5">
              {searchError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{searchError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Seu número de celular <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="(43) 99999-9999"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Usaremos seu número para localizar seu cadastro existente.
                </p>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Buscando...' : 'Continuar'}
              </button>
            </form>
          )}

          {/* ── PASSO 2: Formulário ── */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Banner encontrado / não encontrado */}
              {foundId ? (
                <div className="flex items-start gap-3 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-300 text-sm">
                    Encontramos seu cadastro! Confirme e atualize seus dados abaixo.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <UserPlus className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-300 text-sm">
                    Número não encontrado. Preencha seus dados para se cadastrar.
                  </p>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nome Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                  required
                />
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Celular
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(43) 99999-9999"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  WhatsApp <span className="text-gray-500 text-xs">(se diferente do celular)</span>
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="(43) 99999-9999"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="exemplo@email.com"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>

              {/* Posição Oficial */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Posição Oficial <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <div className="relative">
                  <select
                    name="oficial"
                    value={form.oficial}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                  >
                    {POSICOES.map(p => (
                      <option key={p} value={p}>
                        {p === 'NÃO' ? 'Não possuo posição oficial' : p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Data de Nascimento <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Endereço <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Rua, número, complemento"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Cidade <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Sua cidade"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setFormError(''); }}
                  className="flex-1 border border-slate-600 text-gray-300 hover:bg-slate-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {loading
                    ? 'Enviando...'
                    : foundId
                    ? 'Atualizar Cadastro'
                    : 'Enviar Cadastro'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
