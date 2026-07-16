import { useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Building2, User, Lock, Link } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    church_name: '',
    slug: '',
    admin_email: '',
    admin_password: '',
    admin_password2: '',
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ slug: string; name: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Auto-gera slug a partir do nome da igreja (enquanto nao editado manualmente)
      if (name === 'church_name' && !slugEdited) {
        next.slug = slugify(value);
      }
      if (name === 'slug') {
        setSlugEdited(true);
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.admin_password !== form.admin_password2) {
      setError('As senhas nao conferem.');
      return;
    }
    if (form.admin_password.length < 6) {
      setError('Senha deve ter no minimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/public/create-church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          church_name: form.church_name,
          slug: form.slug,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
      setDone({ slug: data.church.slug, name: data.church.name });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-gray-400 mb-4">
            Bem-vindo(a), <span className="text-white font-medium">{done.name}</span>!
          </p>
          <div className="bg-slate-700 rounded-lg p-3 mb-6 text-left">
            <p className="text-xs text-gray-400 mb-1">Link de cadastro da sua igreja:</p>
            <p className="text-primary-400 text-sm font-mono break-all">
              /cadastro/{done.slug}
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img src="/lobot-logo.svg" alt="Logo" className="w-16 h-16 rounded-lg mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Crie sua conta</h1>
            <p className="text-gray-400 text-sm mt-2">
              Configure o AgentBot Igreja para sua igreja em minutos.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome da Igreja */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <Building2 className="inline w-4 h-4 mr-1 mb-0.5" />
                Nome da Igreja <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="church_name"
                value={form.church_name}
                onChange={handleChange}
                placeholder="Ex: Igreja Manancial Vivo"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <Link className="inline w-4 h-4 mr-1 mb-0.5" />
                Identificador (slug)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm whitespace-nowrap">/cadastro/</span>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="minha-igreja"
                  className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gerado automaticamente. Pode editar se quiser.
              </p>
            </div>

            {/* Divisor */}
            <div className="border-t border-slate-700 pt-1">
              <p className="text-xs text-gray-500 mb-3">Dados do administrador</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <User className="inline w-4 h-4 mr-1 mb-0.5" />
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="admin_email"
                value={form.admin_email}
                onChange={handleChange}
                placeholder="pastor@suaigreja.com"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <Lock className="inline w-4 h-4 mr-1 mb-0.5" />
                Senha <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="admin_password"
                value={form.admin_password}
                onChange={handleChange}
                placeholder="Minimo 6 caracteres"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                required
              />
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <Lock className="inline w-4 h-4 mr-1 mb-0.5" />
                Confirmar Senha <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="admin_password2"
                value={form.admin_password2}
                onChange={handleChange}
                placeholder="Repita a senha"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Criando conta...' : 'Criar conta gratuita'}
            </button>

            <p className="text-center text-xs text-gray-500">
              Ja tem conta?{' '}
              <a href="/login" className="text-primary-400 hover:underline">
                Entrar
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
