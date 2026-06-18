import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { PersonForm, PersonFormData } from '@/components/features/people/PersonForm';
import { getPerson, updatePerson, deletePerson } from '@/services/people';
import { AlertCircle, Trash2 } from 'lucide-react';

interface Person {
  id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  status: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  notes?: string;
  oficial?: string;
}

export default function PersonDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadPerson();
  }, [id]);

  const loadPerson = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await getPerson(id as string);
      if (err) throw err;
      setPerson(data);
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao carregar pessoa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PersonFormData) => {
    if (!person) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Limpar campos vazios
      const cleanData = {
        full_name: data.full_name,
        status: data.status,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || undefined,
        email: data.email || undefined,
        date_of_birth: data.date_of_birth || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        notes: data.notes || undefined,
        oficial: data.oficial || 'NÃO',
      };

      const { error: err } = await updatePerson(person.id, cleanData);
      if (err) throw err;

      setSuccess('Pessoa atualizada com sucesso!');
      setTimeout(() => router.push('/people'), 1500);
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao atualizar pessoa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!person) return;

    setSaving(true);
    setError('');

    try {
      const { error: err } = await deletePerson(person.id);
      if (err) throw err;

      setSuccess('Pessoa deletada com sucesso!');
      setTimeout(() => router.push('/people'), 1500);
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao deletar pessoa');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="p-6">Carregando...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando pessoa...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Pessoa não encontrada</p>
          <button
            onClick={() => router.push('/people')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{person.full_name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Editar informações da pessoa</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <PersonForm
          initialData={person}
          onSubmit={handleSubmit}
          loading={saving}
        />

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 font-medium py-2 border border-gray-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            ← Voltar
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Deletar
          </button>
        </div>

        {/* Modal de Confirmação de Deleção */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
                Confirmar deleção
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja deletar <strong>{person.full_name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:bg-slate-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Deletando...' : 'Deletar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}