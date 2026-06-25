import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createRecurringEvent, Recurrence } from '@/services/agenda';
import { getGroups } from '@/services/groups';
import { getPeople } from '@/services/people';
import { Users, User, Check, Search } from 'lucide-react';

const CHURCH_ID = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const WEEK_OPTIONS = [
  { value: 1, label: '1º' },
  { value: 2, label: '2º' },
  { value: 3, label: '3º' },
  { value: 4, label: '4º' },
];

export default function NewAgendaEvent() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    event_type: 'culto',
    recurrence: 'weekly' as Recurrence,
    day_of_week: 0,
    week_of_month: 1,
    day_of_month: 1,
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  });

  // Associação: grupo OU pessoas
  const [associationType, setAssociationType] = useState<'group' | 'people'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [peopleSearch, setPeopleSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [allPeople, setAllPeople] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    getGroups(CHURCH_ID).then(({ data }) => setGroups(data || []));
    getPeople(CHURCH_ID).then(({ data }) => setAllPeople(data || []));
  }, [user]);

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const filteredPeople = allPeople.filter(p =>
    p.full_name.toLowerCase().includes(peopleSearch.toLowerCase())
  );

  const togglePerson = (id: string) => {
    setSelectedPeopleIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Título é obrigatório'); return; }
    if (form.recurrence === 'once' && !form.event_date) { setError('Informe a data do evento'); return; }
    if (associationType === 'people' && selectedPeopleIds.length === 0) {
      setError('Selecione ao menos uma pessoa'); return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        event_type: form.event_type,
        recurrence: form.recurrence,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location || null,
        notes: form.notes || null,
        group_id: associationType === 'group' ? (selectedGroupId || null) : null,
        people_ids: associationType === 'people' ? selectedPeopleIds : [],
      };

      if (form.recurrence === 'weekly') {
        payload.day_of_week = form.day_of_week;
      } else if (form.recurrence === 'monthly_weekday') {
        payload.day_of_week = form.day_of_week;
        payload.week_of_month = form.week_of_month;
      } else if (form.recurrence === 'monthly_date') {
        payload.day_of_month = form.day_of_month;
      } else if (form.recurrence === 'once') {
        payload.event_date = form.event_date;
      }

      const { error: err } = await createRecurringEvent(CHURCH_ID, payload);
      if (err) throw err;
      router.push('/agenda');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 mb-6">
        ← Voltar
      </button>
      <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Novo Evento</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 space-y-5">

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ex: Culto de Domingo, GCEU Zona Sul..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
          <select
            value={form.event_type}
            onChange={e => set('event_type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="culto">⛪ Culto</option>
            <option value="gceu">👥 GCEU / Grupo</option>
            <option value="missoes">🌍 Missões</option>
            <option value="evangelismo">📢 Evangelismo</option>
            <option value="estudo_biblico">📖 Estudo Bíblico</option>
            <option value="reuniao_ministerio">🙏 Reunião de Ministério</option>
            <option value="outro">📋 Outro</option>
          </select>
        </div>

        {/* Recorrência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recorrência *</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'weekly', label: '📅 Semanal', desc: 'Ex: toda terça' },
              { value: 'monthly_weekday', label: '📆 Mensal (dia)', desc: 'Ex: 1º domingo' },
              { value: 'monthly_date', label: '🗓 Mensal (data)', desc: 'Ex: todo dia 15' },
              { value: 'once', label: '📌 Eventual', desc: 'Uma data específica' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => set('recurrence', opt.value)}
                className={`px-3 py-2.5 rounded-lg border text-left transition-colors
                  ${form.recurrence === opt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'}`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Campos condicionais */}
        {form.recurrence === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia da semana</label>
            <select value={form.day_of_week} onChange={e => set('day_of_week', Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              {DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        )}

        {form.recurrence === 'monthly_weekday' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semana</label>
              <select value={form.week_of_month} onChange={e => set('week_of_month', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                {WEEK_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia da semana</label>
              <select value={form.day_of_week} onChange={e => set('day_of_week', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                {DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <p className="col-span-2 text-xs text-gray-500 dark:text-gray-400 -mt-2">
              → {WEEK_OPTIONS[form.week_of_month - 1]?.label} {DAY_OPTIONS[form.day_of_week]?.label} de cada mês
            </p>
          </div>
        )}

        {form.recurrence === 'monthly_date' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia do mês</label>
            <select value={form.day_of_month} onChange={e => set('day_of_month', Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Dia {d}</option>)}
            </select>
          </div>
        )}

        {form.recurrence === 'once' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
            <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        )}

        {/* Horário */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Término</label>
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        {/* Local */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Local</label>
          <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
            placeholder="Ex: Templo principal, Casa do líder..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        {/* Associação: Grupo OU Pessoas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participantes</label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setAssociationType('group')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors
                ${associationType === 'group'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'}`}
            >
              <Users className="w-4 h-4" />Grupo
            </button>
            <button type="button" onClick={() => setAssociationType('people')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors
                ${associationType === 'people'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'}`}
            >
              <User className="w-4 h-4" />Pessoas específicas
            </button>
          </div>

          {associationType === 'group' ? (
            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Nenhum (evento geral)</option>
              {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              {/* Busca */}
              <div className="relative border-b border-gray-200 dark:border-slate-600">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pessoa..."
                  value={peopleSearch}
                  onChange={e => setPeopleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                />
              </div>
              {/* Lista */}
              <div className="max-h-48 overflow-y-auto">
                {filteredPeople.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Nenhuma pessoa encontrada</p>
                ) : filteredPeople.map((p: any) => {
                  const selected = selectedPeopleIds.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => togglePerson(p.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors text-sm
                        ${selected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                      <span className={selected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-800 dark:text-gray-200'}>
                        {p.full_name}
                      </span>
                      {selected && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {/* Contador */}
              {selectedPeopleIds.length > 0 && (
                <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-t border-gray-200 dark:border-slate-600">
                  <span className="text-xs text-primary-700 dark:text-primary-300 font-medium">
                    {selectedPeopleIds.length} pessoa{selectedPeopleIds.length > 1 ? 's' : ''} selecionada{selectedPeopleIds.length > 1 ? 's' : ''}
                  </span>
                  <button type="button" onClick={() => setSelectedPeopleIds([])}
                    className="ml-3 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                    Limpar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg">
            {saving ? 'Salvando...' : 'Salvar Evento'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
