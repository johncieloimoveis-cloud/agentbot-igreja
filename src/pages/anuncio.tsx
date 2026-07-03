import { useState } from 'react';
import { CheckCircle, Megaphone } from 'lucide-react';

export default function Anuncio() {
  const [form, setForm] = useState({ empresa: '', mensagem: '', contato: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.empresa.trim() || !form.mensagem.trim()) {
      setError('Nome da empresa e mensagem são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/public/anuncio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Anúncio enviado!</h2>
          <p className="text-gray-400">Seu anúncio foi recebido e será revisado em breve.</p>
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
            <div className="flex items-center justify-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-primary-400" />
              <h1 className="text-2xl font-bold text-white">Anuncie aqui</h1>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Divulgue seu negócio para toda a nossa comunidade.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome da empresa / negócio <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                placeholder="Ex: Padaria Pão de Vida"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Mensagem do anúncio <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="mensagem"
                value={form.mensagem}
                onChange={handleChange}
                placeholder="Ex: Pão fresquinho todo dia, venha nos visitar!"
                maxLength={120}
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{form.mensagem.length}/120 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Contato <span className="text-gray-500 text-xs">(telefone, instagram, site...)</span>
              </label>
              <input
                type="text"
                name="contato"
                value={form.contato}
                onChange={handleChange}
                placeholder="(43) 99999-9999 / @seunegocio"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Enviando...' : 'Enviar para aprovação'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
