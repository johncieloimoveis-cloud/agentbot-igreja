import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { PersonForm, PersonFormData } from '@/components/features/people/PersonForm';
import { createPerson } from '@/services/people';
import { AlertCircle } from 'lucide-react';
export default function NewPerson() {
  const router = useRouter();
  const { user, church_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (data: PersonFormData) => {
  if (!user) {
    setError('Você precisa estar logado');
    return;
  }
  setLoading(true);
  setError('');
  try {
    const churchId = church_id || '';
    // Limpar campos vazios (converter "" em undefined)
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
      created_by: user.id,
    };
    const { error: err } = await createPerson(churchId, cleanData);
    if (err) throw err;
    router.push('/people');
  } catch (err: any) {
    console.error('Erro:', err);
    setError(err?.message || 'Erro ao criar pessoa. Tente novamente.');
  } finally {
    setLoading(false);
  }
};
  if (!user) {
    return <div className="p-6">Carregando...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white mb-6"
        >
          ← Voltar
        </button>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Nova Pessoa</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Preencha os dados da nova pessoa na igreja</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <PersonForm onSubmit={handleSubmit} loading={loading} />
        <button
          onClick={() => router.back()}
          className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:text-white font-medium"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
