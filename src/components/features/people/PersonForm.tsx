import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const personSchema = z.object({
  full_name: z.string().min(3, 'Nome obrigatório'),
  status: z.string().min(1, 'Status obrigatório'),
  phone: z.any().optional(),
  whatsapp: z.any().optional(),
  email: z.any().optional(),
  date_of_birth: z.any().optional(),
  address: z.any().optional(),
  city: z.any().optional(),
  notes: z.any().optional(),
});

export type PersonFormData = z.infer<typeof personSchema>;

interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  loading?: boolean;
}

export function PersonForm({ initialData, onSubmit, loading }: PersonFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: initialData,
  });

  // Type guards for error messages
  const fullNameError = typeof errors.full_name?.message === 'string' ? errors.full_name.message : undefined;
  const emailError = typeof errors.email?.message === 'string' ? errors.email.message : undefined;
  const statusError = typeof errors.status?.message === 'string' ? errors.status.message : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
      {/* Nome completo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo *
        </label>
        <input
          {...register('full_name')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Digite o nome completo"
        />
        {fullNameError && <p className="text-red-500 text-sm mt-1">{fullNameError}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="exemplo@email.com"
        />
        {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
      </div>

      {/* Telefone e WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefone
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="(11) 1234-5678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            WhatsApp
          </label>
          <input
            {...register('whatsapp')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="(11) 98765-4321"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status *
        </label>
        <select
          {...register('status')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Selecione um status</option>
          <option value="visitor">Visitante</option>
          <option value="active_member">Membro Ativo</option>
          <option value="new_convert">Novo Convertido</option>
          <option value="in_discipleship">Em Discipulado</option>
          <option value="absent">Afastado</option>
          <option value="transferred">Transferido</option>
          <option value="leader">Liderança</option>
        </select>
        {statusError && <p className="text-red-500 text-sm mt-1">{statusError}</p>}
      </div>

      {/* Data de Nascimento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Data de Nascimento
        </label>
        <input
          {...register('date_of_birth')}
          type="date"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Endereço */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Endereço
        </label>
        <input
          {...register('address')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Rua, número, complemento"
        />
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cidade
        </label>
        <input
          {...register('city')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="São Paulo"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações
        </label>
        <textarea
          {...register('notes')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={4}
          placeholder="Adicione observações sobre a pessoa..."
        />
      </div>

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? 'Salvando...' : 'Salvar Pessoa'}
      </button>
    </form>
  );
}
