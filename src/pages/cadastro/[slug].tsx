import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, ChevronDown, Search, UserCheck, UserPlus, AlertTriangle } from 'lucide-react';

const POSICOES = [
  'NAO',
  'Pastor(a)',
  'Aspirante(a)',
  'Presbitero(a)',
  'Diacono(isa)',
  'Missionario(a)',
  'Secretario(a)',
];

type Step = 'loading' | 'error' | 'phone' | 'name' | 'form' | 'done';

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
  oficial: 'NAO',
  date_of_birth: '',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
};

export default function CadastroSlug() {
  const router = useRouter();
  const { slug } = router.query;

  const [churchId, setChurchId] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string>('');
  const [step, setStep] = useState<Step>('loading');

  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [foundId, setFoundId] = useState<string | null>(null);
  const [foundByName, setFoundByName] = useState(false);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Resolve slug → church_id
  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    fetch(`/api/public/church-by-slug?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.church) {
          setChurchId(data.church.id);
          setChurchName(data.church.name);
          setStep('phone');
        } else {
          setStep('error');
        }
      })
      .catch(() => setStep('error'));
  }, [slug]);

  /* Passo 1: busca por telefone */
  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || !churchId) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `/api/public/find-person?phone=${encodeURIComponent(phoneInput.trim())}&church_id=${churchId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar');
      if (data.person) {
        setFoundId(data.person.id);
        setFoundByName(false);
        setForm({
          full_name: data.person.full_name || '',
          email: data.person.email || '',
          oficial: data.person.oficial || 'NAO',
          date_of_birth: data.person.date_of_birth || '',
          address: data.person.address || '',
          city: data.person.city || '',
          phone: data.person.phone || phoneInput.trim(),
          whatsapp: data.person.whatsapp || '',
        });
        setStep('form');
      } else {
        setFoundId(null);
        setForm({ ...EMPTY_FORM, phone: phoneInput.trim() });
        setStep('name');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao buscar. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  /* Passo 1b: busca por nome */
  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !churchId) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `/api/public/find-person?name=${encodeURIComponent(nameInput.trim())}&church_id=${churchId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar');
      if (data.person) {
        setFoundId(data.person.id);
        setFoundByName(true);
        setForm({
          full_name: data.person.full_name || nameInput.trim(),
          email: data.person.email || '',
          oficial: data.person.oficial || 'NAO',
          date_of_birth: data.person.date_of_birth || '',
          address: data.person.address || '',
          city: data.person.city || '',
          phone: phoneInput.trim(),
          whatsapp: data.person.whatsapp || '',
        });
      } else {
        setFoundId(null);
        setFoundByName(false);
        setForm({ ...EMPTY_FORM, phone: phoneInput.trim(), full_name: nameInput.trim() });
      }
      setStep('form');
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao buscar. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const skipNameSearch = () => {
    setFoundId(null);
    setFoundByName(false);
    setForm({ ...EMPTY_FORM, phone: phoneInput.trim() });
    setStep('form');
  };

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
    if (!churchId) return;
    setLoading(true);
    try {
      const method = foundId ? 'PATCH' : 'POST';
      const body = foundId
        ? { ...form, id: foundId, church_id: churchId }
        : { ...form, church_id: churchId };

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

  // Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  // Church not found
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <p className="text-red-400 text-lg font-semibold">Igreja nao encontrada.</p>
          <p className="text-gray-500 mt-2 text-sm">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  // Done
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
              ? 'Suas informacoes foram atualizadas com sucesso.'
              : 'Obrigado! Suas informacoes foram recebidas com sucesso.'}
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
            <h1 className="text-2xl font-bold text-white">Atualizacao de Cadastro</h1>
            {churchName && (
              <p className="text-primary-400 text-sm font-medium mt-1">{churchName}</p>
            )}
            <p className="text-gray-400 text-sm mt-2">
              Mantenha seus dados atualizados na nossa familia.
            </p>
          </div>

          {/* PASSO 1: Celular */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSearch} className="space-y-5">
              {searchError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{searchError}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Seu numero de celular <span className="text-red-400">*</span>
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
                  Usaremos seu numero para localizar seu cadastro existente.
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

          {/* PASSO 1b: Busca por nome */}
          {step === 'name' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3 bg-amber-900/30 border border-amber-700 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300 text-sm">
                  Nao encontramos esse numero no cadastro. Digite seu nome para verificar se voce ja esta cadastrado com outro numero.
                </p>
              </div>
              {searchError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{searchError}</p>
                </div>
              )}
              <form onSubmit={handleNameSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Seu nome completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {searching ? 'Buscando...' : 'Verificar nome'}
                </button>
              </form>
              <div className="text-center">
                <button
                  onClick={skipNameSearch}
                  className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                >
                  Sou novo aqui, nunca me cadastrei
                </button>
              </div>
              <button
                onClick={() => { setStep('phone'); setSearchError(''); }}
                className="w-full border border-slate-600 text-gray-300 hover:bg-slate-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Voltar
              </button>
            </div>
          )}

          {/* PASSO 2: Formulario */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {foundId && !foundByName ? (
                <div className="flex items-start gap-3 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-300 text-sm">
                    Encontramos seu cadastro! Confirme e atualize seus dados abaixo.
                  </p>
                </div>
              ) : foundId && foundByName ? (
                <div className="flex items-start gap-3 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-300 text-sm">
                    Encontramos seu cadastro pelo nome! Seu numero de celular sera atualizado.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <UserPlus className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-300 text-sm">
                    Nao encontramos seu cadastro. Preencha seus dados para se cadastrar.
                  </p>
                </div>
              )}
              {formError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Celular</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(43) 99999-9999"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Posicao Oficial <span className="text-gray-500 text-xs">(opcional)</span>
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
                        {p === 'NAO' ? 'Nao possuo posicao oficial' : p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Endereco <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Rua, numero, complemento"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>
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
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep(foundId ? 'phone' : 'name'); setFormError(''); }}
                  className="flex-1 border border-slate-600 text-gray-300 hover:bg-slate-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Enviando...' : foundId ? 'Atualizar Cadastro' : 'Enviar Cadastro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
