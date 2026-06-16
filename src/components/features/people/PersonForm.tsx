import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const personSchema = z.object({
  full_name: z.string().min(3, 'Nome obrigatório'),
  status: z.string().min(1, 'Status obrigatório'),
  eh_lider: z.boolean().optional(),
  oficial: z.string().optional(),
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
  const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: initialData,
  });

  // Watch para validação dinâmica
  const ehLider = useWatch({ control, name: 'eh_lider' });
  const oficial = useWatch({ control, name: 'oficial' });

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
          <option value="eventual">Eventual</option>
          <option value="active_member">Membro Ativo</option>
          <option value="new_convert">Novo Convertido</option>
          <option value="in_discipleship">Em Discipulado</option>
          <option value="absent">Afastado</option>
          <option value="transferred">Transferido</option>
          <option value="leader">Liderança</option>
        </select>
        {statusError && <p className="text-red-500 text-sm mt-1">{statusError}</p>}
      </div>

      {/* Classificações */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Classificações</h3>

        {/* Líder */}
        <div className="mb-4">
          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border-2 border-gray-200 dark:border-slate-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="relative w-6 h-6">
              <input
                {...register('eh_lider')}
                type="checkbox"
                className="w-6 h-6 cursor-pointer appearance-none rounded border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-slate-600 checked:bg-blue-600 dark:checked:bg-blue-600 checked:border-blue-600 dark:checked:border-blue-600"
              />
              <svg
                className="absolute top-0.5 left-0.5 w-5 h-5 text-white pointer-events-none hidden"
                style={{display: 'none'}}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
              É líder de grupo
            </span>
          </label>
        </div>

        {/* Oficial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posição Oficial
          </label>
          <select
            {...register('oficial')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="NÃO">Não possui posição oficial</option>
            <option value="Pastor(a)">Pastor(a)</option>
            <option value="Aspirante(a)">Aspirante(a)</option>
            <option value="Presbítero(a)">Presbítero(a)</option>
            <option value="Diácono(isa)">Diácono(isa)</option>
            <option value="Missionário(a)">Missionário(a)</option>
            <option value="Secretário(a)">Secretário(a)</option>
          </select>
        </div>
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
