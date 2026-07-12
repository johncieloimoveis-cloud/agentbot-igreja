import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpTooltip } from '@/components/HelpTooltip';

const personSchema = z.object({
  full_name: z.string().min(3, 'Nome obrigatório'),
  status: z.string().min(1, 'Status obrigatório'),
  oficial: z.string().optional(),
  phone: z.any().optional(),
  whatsapp: z.any().optional(),
  email: z.any().optional(),
  date_of_birth: z.any().optional(),
  address: z.any().optional(),
  city: z.any().optional(),
  notes: z.any().optional(),
  lat: z.any().optional(),
  lon: z.any().optional(),
});

export type PersonFormData = z.infer<typeof personSchema>;

interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  loading?: boolean;
}

export function PersonForm({ initialData, onSubmit, loading }: PersonFormProps) {
  const { register, handleSubmit, formState: { errors }, control } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: initialData,
  });

  const fullNameError = typeof errors.full_name?.message === 'string' ? errors.full_name.message : undefined;
  const emailError = typeof errors.email?.message === 'string' ? errors.email.message : undefined;
  const statusError = typeof errors.status?.message === 'string' ? errors.status.message : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">

      {/* Nome completo */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo *
          <HelpTooltip text="Nome completo da pessoa como será usado em relatórios, mensagens e fichas pastorais." />
        </label>
        <input {...register('full_name')} type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Digite o nome completo" />
        {fullNameError && <p className="text-red-500 text-sm mt-1">{fullNameError}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
          <HelpTooltip text="Endereço de e-mail para contato. Usado para comunicações e login futuro." />
        </label>
        <input {...register('email')} type="email"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="exemplo@email.com" />
        {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
      </div>

      {/* Telefone e WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefone
            <HelpTooltip text="Telefone fixo ou celular. Pode ser diferente do WhatsApp." />
          </label>
          <input {...register('phone')} type="tel"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="(11) 1234-5678" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            WhatsApp
            <HelpTooltip text="Número do WhatsApp. Usado nos botões de envio de mensagem pastoral direto do sistema." />
          </label>
          <input {...register('whatsapp')} type="tel"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="(11) 98765-4321" />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status *
          <HelpTooltip width="w-72" text="Define a situação pastoral da pessoa: Visitante = veio uma vez; Eventual = aparece às vezes; Membro Ativo = frequenta regularmente; Afastado = parou de frequentar; Transferido = foi para outra igreja." />
        </label>
        <select {...register('status')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Selecione um status</option>
          <option value="visitor">Visitante</option>
          <option value="eventual">Eventual</option>
          <option value="active_member">Membro Ativo</option>
          <option value="new_convert">Novo Convertido</option>
          <option value="in_discipleship">Em Discipulado</option>
          <option value="absent">Afastado</option>
          <option value="transferred">Transferido</option>
        </select>
        {statusError && <p className="text-red-500 text-sm mt-1">{statusError}</p>}
      </div>

      {/* Classificações */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Classificações</h3>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posição Oficial
            <HelpTooltip text="Cargo formal da pessoa na estrutura da igreja. Usado no organograma e nos relatórios de liderança." />
          </label>
          <select {...register('oficial')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
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
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Data de Nascimento
          <HelpTooltip text="Usada para gerar automaticamente alertas de aniversário no Dashboard e nas Ações Pastorais dos grupos." />
        </label>
        <input {...register('date_of_birth')} type="date"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {/* Endereço */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Endereço
          <HelpTooltip text="Rua, número e complemento. Útil para visitas pastorais." />
        </label>
        <input {...register('address')} type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Rua, número, complemento" />
      </div>

      {/* Cidade */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cidade
          <HelpTooltip text="Cidade de residência. Ajuda a organizar membros por região." />
        </label>
        <input {...register('city')} type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="São Paulo" />
      </div>

      {/* Coordenadas manuais */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Coordenadas (opcional)</span>
          <HelpTooltip text="Preencha somente se o endereço nao for localizado automaticamente. Para obter: abra o Google Maps, clique com botao direito no local exato e copie as coordenadas." />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Informe as coordenadas (latitude e longitude) OU o endereço (rua, número, bairro, cidade).</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Latitude</label>
            <input {...register('lat')} type="number" step="any"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="-23.8453" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Longitude</label>
            <input {...register('lon')} type="number" step="any"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="-50.1906" />
          </div>
        </div>
      </div>

      {/* Observacoes */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações
          <HelpTooltip text="Anotações pastorais livres. Ex: situação familiar, pedidos de oração, contexto de vida. Visível apenas para líderes." />
        </label>
        <textarea {...register('notes')} rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Adicione observações sobre a pessoa..." />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors">
        {loading ? 'Salvando...' : 'Salvar Pessoa'}
      </button>
    </form>
  );
}
