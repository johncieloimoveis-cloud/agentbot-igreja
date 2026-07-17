import { useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Heart } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

const CAMINHADA = [
  'Ja sou cristao/crente.',
  'Sou de outra religiao.',
  'Estou pesquisando / conhecendo a fe.',
  'Nao tenho religiao.',
];

const INTERESSE = [
  'Sim, desejo informacoes sobre como ser membro desta igreja.',
  'Gostaria de conhecer mais antes de decidir.',
  'Por enquanto, estou apenas visitando.',
];

const APOIO = [
  'Gostaria de receber uma visita em minha casa.',
  'Prefiro que entrem em contato comigo por WhatsApp para conversar.',
  'Quero receber informacoes sobre as atividades da igreja.',
  'Apenas gostaria de pedir oracao por uma necessidade.',
];

export default function FormVisitante() {
  const router = useRouter();
  const slug = router.query.slug as string;

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [caminhada, setCaminhada] = useState('');
  const [interesse, setInteresse] = useState('');
  const [apoio, setApoio] = useState('');
  const [oracao, setOracao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [feito, setFeito] = useState(false);

  if (!slug) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setErro('Por favor, informe seu nome.'); return; }
    setErro('');
    setLoading(true);
    try {
      const res = await fetch('/api/public/visitor-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          full_name: nome,
          phone: telefone,
          whatsapp,
          caminhada_espiritual: caminhada,
          interesse_comunidade: interesse,
          como_apoiar: apoio,
          pedido_oracao: oracao,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');
      setFeito(true);
    } catch (err: any) {
      setErro(err.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (feito) {
    return (
      <PublicLayout slug={slug}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Que alegria!</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Seu cadastro foi recebido. A lideranca da igreja entrara em contato em breve. Que Deus abencoe voce!
          </p>
        </div>
      </PublicLayout>
    );
  }

  const Radio = ({ name, value, checked, onChange, label }: {
    name: string; value: string; checked: boolean; onChange: () => void; label: string;
  }) => (
    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
      checked
        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-600'
        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
    }`}>
      <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        checked ? 'border-primary-500' : 'border-gray-300 dark:border-slate-600'
      }`}>
        {checked && <div className="w-2 h-2 rounded-full bg-primary-500" />}
      </div>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{label}</span>
    </label>
  );

  return (
    <PublicLayout slug={slug}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Que alegria ter voce conosco!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
            Queremos te conhecer um pouco melhor e saber como podemos caminhar junto com voce na fe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados pessoais */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Meus dados</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome completo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp / Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(43) 99999-9999"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Caminhada espiritual */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800 dark:text-white">1. Qual e a sua caminhada espiritual?</h2>
            {CAMINHADA.map(op => (
              <Radio key={op} name="caminhada" value={op} checked={caminhada === op} onChange={() => setCaminhada(op)} label={op} />
            ))}
          </div>

          {/* Interesse */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800 dark:text-white">2. Voce gostaria de fazer parte da nossa familia?</h2>
            {INTERESSE.map(op => (
              <Radio key={op} name="interesse" value={op} checked={interesse === op} onChange={() => setInteresse(op)} label={op} />
            ))}
          </div>

          {/* Como apoiar */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800 dark:text-white">3. Como podemos te apoiar?</h2>
            {APOIO.map(op => (
              <Radio key={op} name="apoio" value={op} checked={apoio === op} onChange={() => setApoio(op)} label={op} />
            ))}
          </div>

          {/* Pedido de oracao */}
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-800 dark:text-white">Pedido de oracao ou comentario adicional</h2>
            <textarea
              value={oracao}
              onChange={e => setOracao(e.target.value)}
              placeholder="Escreva aqui se quiser..."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400 resize-none"
            />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
          >
            {loading ? 'Enviando...' : 'Enviar cadastro'}
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}
