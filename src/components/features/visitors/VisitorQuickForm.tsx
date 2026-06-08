import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface VisitorData {
  full_name: string;
  phone: string;
  whatsapp: string;
  culto_evento: string;
  como_conheceu: string;
  interesse_gceu: boolean;
  interesse_estudo: boolean;
  deseja_contato: boolean;
}

interface VisitorQuickFormProps {
  onSubmit: (data: VisitorData) => Promise<void>;
  loading?: boolean;
}

export function VisitorQuickForm({ onSubmit, loading }: VisitorQuickFormProps) {
  const [formData, setFormData] = useState<VisitorData>({
    full_name: '',
    phone: '',
    whatsapp: '',
    culto_evento: '',
    como_conheceu: '',
    interesse_gceu: false,
    interesse_estudo: false,
    deseja_contato: false,
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.whatsapp.trim() && !formData.phone.trim()) {
      setError('Telefone ou WhatsApp é obrigatório');
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        full_name: '',
        phone: '',
        whatsapp: '',
        culto_evento: '',
        como_conheceu: '',
        interesse_gceu: false,
        interesse_estudo: false,
        deseja_contato: false,
      });
    } catch (err) {
      setError('Erro ao cadastrar visitante');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome Completo *
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nome da pessoa"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="(11) 1234-5678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="(11) 98765-4321"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Participou de qual culto/evento?
        </label>
        <select
          value={formData.culto_evento}
          onChange={(e) => setFormData({ ...formData, culto_evento: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Selecione</option>
          <option value="culto_domingo">Culto Domingo</option>
          <option value="culto_quinta">Culto Quinta</option>
          <option value="escola_biblica">Escola Bíblica</option>
          <option value="evento_especial">Evento Especial</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Como conheceu a igreja?
        </label>
        <input
          type="text"
          value={formData.como_conheceu}
          onChange={(e) => setFormData({ ...formData, como_conheceu: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Ex: Convite de amigo"
        />
      </div>

      <div className="space-y-3 border-t dark:border-slate-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tem interesse em:
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.interesse_gceu}
            onChange={(e) =>
              setFormData({ ...formData, interesse_gceu: e.target.checked })
            }
            className="w-4 h-4 rounded"
          />
          <span className="text-gray-700 dark:text-gray-300">GCEU / Grupo Pequeno</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.interesse_estudo}
            onChange={(e) =>
              setFormData({ ...formData, interesse_estudo: e.target.checked })
            }
            className="w-4 h-4 rounded"
          />
          <span className="text-gray-700 dark:text-gray-300">Estudo Bíblico</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.deseja_contato}
            onChange={(e) =>
              setFormData({ ...formData, deseja_contato: e.target.checked })
            }
            className="w-4 h-4 rounded"
          />
          <span className="text-gray-700 dark:text-gray-300">Deseja ser contatado</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        {loading ? 'Cadastrando...' : 'Cadastrar Visitante'}
      </button>
    </form>
  );
}