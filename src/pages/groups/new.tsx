import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createGroup } from '@/services/groups';

export default function NewGroup() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    meeting_day: '',
    meeting_time: '',
    meeting_address: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      await createGroup(churchId, formData);
      router.push('/groups');
    } catch (err) {
      setError('Erro ao criar grupo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl font-bold mb-6">Novo Grupo</h1>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Grupo *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: Grupo Centro"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dia da Reunião
            </label>
            <select
              value={formData.meeting_day}
              onChange={(e) => setFormData({ ...formData, meeting_day: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione</option>
              <option value="segunda">Segunda</option>
              <option value="terca">Terça</option>
              <option value="quarta">Quarta</option>
              <option value="quinta">Quinta</option>
              <option value="sexta">Sexta</option>
              <option value="sabado">Sábado</option>
              <option value="domingo">Domingo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horário
            </label>
            <input
              type="time"
              value={formData.meeting_time}
              onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endereço
          </label>
          <input
            type="text"
            value={formData.meeting_address}
            onChange={(e) => setFormData({ ...formData, meeting_address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Rua, número, complemento"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
        >
          {saving ? 'Criando...' : 'Criar Grupo'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100"
      >
        ← Voltar
      </button>
    </div>
  );
}