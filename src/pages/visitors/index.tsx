import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getVisitors, createVisitor } from '@/services/visitors';
import { VisitorQuickForm } from '@/components/features/visitors/VisitorQuickForm';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Plus } from 'lucide-react';

interface Visitor {
  id: string;
  full_name: string;
  whatsapp?: string;
  created_at: string;
}

export default function Visitors() {
  const router = useRouter();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadVisitors();
  }, [user]);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getVisitors(churchId);
      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisitor = async (data: any) => {
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      await createVisitor(churchId, data);
      setShowForm(false);
      loadVisitors();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6"
      >
        ← Voltar
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Visitantes</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded"
        >
          <Plus className="w-5 h-5" />
          Novo Visitante
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-4"
          >
            ← Voltar
          </button>
          <VisitorQuickForm onSubmit={handleCreateVisitor} loading={false} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : visitors.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhum visitante cadastrado</p>
      ) : (
        <div className="space-y-4">
          {visitors.map((visitor) => (
            <div key={visitor.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <h3 className="font-bold">{visitor.full_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(visitor.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {visitor.whatsapp && (
                <WhatsAppButton
                  phone={visitor.whatsapp}
                  name={visitor.full_name}
                  messageType="visitor"
                  size="sm"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}