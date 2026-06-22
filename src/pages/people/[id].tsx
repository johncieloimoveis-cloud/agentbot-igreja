import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { PersonForm, PersonFormData } from '@/components/features/people/PersonForm';
import { getPerson, updatePerson, deletePerson } from '@/services/people';
import { AlertCircle, Trash2, Sparkles, MessageCircle, X, Send } from 'lucide-react';

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

const MESSAGE_TYPES = [
  { value: 'checkin', label: 'Check-in', description: 'Perguntar como a pessoa está' },
  { value: 'resgate', label: 'Resgate', description: 'Pessoa ausente há tempo' },
  { value: 'aniversario', label: 'Aniversário', description: 'Parabenizar pelo aniversário' },
  { value: 'tarefa', label: 'Acompanhamento', description: 'Iniciar acompanhamento pastoral' },
];

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

  // IA states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessageType, setAiMessageType] = useState('checkin');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [weeksAbsent, setWeeksAbsent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');

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
        oficial: data.oficial || 'NAO',
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

  const handleGenerateMessage = async () => {
    if (!person) return;
    setAiGenerating(true);
    setAiError('');
    setAiMessage('');
    try {
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: aiMessageType,
          personName: person.full_name.split(' ')[0],
          weeksAbsent: weeksAbsent || undefined,
          taskTitle: taskTitle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      setAiMessage(data.message);
    } catch (err: any) {
      setAiError(err.message || 'Erro ao gerar mensagem');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!person || !aiMessage) return;
    const phone = (person.whatsapp || person.phone || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(aiMessage);
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  if (!user) return <div className="p-6">Carregando...</div>;

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
          <p className="text-gray-600 dark:text-gray-400 text-lg">Pessoa nao encontrada</p>
          <button onClick={() => router.push('/people')} className="mt-4 text-primary-600 hover:underline">
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{person.full_name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Editar informacoes da pessoa</p>
          </div>
          <button
            onClick={() => { setShowAiModal(true); setAiMessage(''); setAiError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Mensagem IA
          </button>
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

        <PersonForm initialData={person} onSubmit={handleSubmit} loading={saving} />

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 font-medium py-2 border border-gray-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            Voltar
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

        {/* Modal IA */}
        {showAiModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerar Mensagem IA</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Tipo de mensagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de mensagem</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MESSAGE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setAiMessageType(t.value)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          aiMessageType === t.value
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                            : 'border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{t.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campos extras por tipo */}
                {aiMessageType === 'resgate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ha quantas semanas ausente? (opcional)
                    </label>
                    <input
                      type="number"
                      value={weeksAbsent}
                      onChange={(e) => setWeeksAbsent(e.target.value)}
                      placeholder="Ex: 3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}
                {aiMessageType === 'tarefa' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assunto do acompanhamento (opcional)
                    </label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Ex: visita hospitalar, aconselhamento..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}

                {/* Botao gerar */}
                <button
                  onClick={handleGenerateMessage}
                  disabled={aiGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiGenerating ? 'Gerando...' : 'Gerar Mensagem'}
                </button>

                {aiError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
                )}

                {/* Mensagem gerada */}
                {aiMessage && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mensagem gerada (edite se quiser)
                    </label>
                    <textarea
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      onClick={handleSendWhatsApp}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar via WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Delete */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Confirmar delecao</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja deletar <strong>{person.full_name}</strong>? Esta acao nao pode ser desfeita.
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
