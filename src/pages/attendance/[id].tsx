import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import {
  getAttendanceEvent,
  getEventAttendances,
  recordAttendance,
  removeAttendance,
  recordMultipleAttendances,
} from '@/services/attendance';
import { getPeople } from '@/services/people';
import { CheckCircle, Circle, Trash2, Plus, Search, X } from 'lucide-react';

interface Person {
  id: string;
  full_name: string;
  phone?: string;
}

interface AttendanceRecord {
  id: string;
  person: Person;
  attended: boolean;
  recorded_at: string;
}

export default function AttendanceDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [event, setEvent] = useState<any>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [searchPeople, setSearchPeople] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      // Carregar evento
      const { data: eventData, error: eventError } = await getAttendanceEvent(id as string);
      if (eventError) throw eventError;
      setEvent(eventData);

      // Carregar presenças
      const { data: attendancesData, error: attendancesError } = await getEventAttendances(
        id as string
      );
      if (attendancesError) throw attendancesError;
      setAttendances(attendancesData || []);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePeople = async () => {
    setLoadingPeople(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      const { data, error } = await getPeople(churchId, undefined, searchPeople || undefined);
      if (error) throw error;

      // Filtrar pessoas que já estão registradas
      const attendedPersonIds = attendances.map((a) => a.person.id);
      const filteredPeople = (data || []).filter(
        (person: any) => !attendedPersonIds.includes(person.id)
      );

      setAvailablePeople(filteredPeople);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar pessoas');
    } finally {
      setLoadingPeople(false);
    }
  };

  const handleAddAttendance = async (personId: string) => {
    setAddingMember(true);
    try {
      const { error: err } = await recordAttendance(id as string, personId, true);
      if (err) throw err;

      setSearchPeople('');
      setShowAddForm(false);
      loadEventData();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao registrar presença');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveAttendance = async (attendanceId: string) => {
    if (!confirm('Remover este registro de presença?')) return;

    try {
      const { error: err } = await removeAttendance(attendanceId);
      if (err) throw err;
      loadEventData();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao remover presença');
    }
  };

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    loadAvailablePeople();
  };

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      culto: '⛪ Culto',
      estudo_biblico: '📖 Estudo Bíblico',
      reuniao_ministerio: '🙏 Reunião de Ministério',
      evento_especial: '🎉 Evento Especial',
      gceu: '👥 Grupo',
      outro: '📋 Outro',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="text-gray-600 hover:text-gray-900 mb-6"
      >
        ← Voltar
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex justify-between items-center">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          {/* Informações do Evento */}
          {event && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{getEventTypeLabel(event.event_type)?.split(' ')[0] || '📋'}</span>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {event.name}
                  </h1>
                  <p className="text-gray-600 mt-2">{formatDate(event.event_date)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Presenças */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Presenças ({attendances.filter((a) => a.attended).length}/{attendances.length})
              </h2>
              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                Adicionar Presença
              </button>
            </div>

            {/* Formulário de Adicionar */}
            {showAddForm && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Adicionar Pessoa</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Pessoa
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Digite o nome..."
                      value={searchPeople}
                      onChange={(e) => {
                        setSearchPeople(e.target.value);
                        if (e.target.value.length > 0) {
                          setLoadingPeople(true);
                          setTimeout(() => {
                            const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
                            getPeople(churchId, undefined, e.target.value).then(({ data }) => {
                              const attendedPersonIds = attendances.map((a) => a.person.id);
                              const filteredPeople = (data || []).filter(
                                (person: any) => !attendedPersonIds.includes(person.id)
                              );
                              setAvailablePeople(filteredPeople);
                              setLoadingPeople(false);
                            });
                          }, 300);
                        } else {
                          loadAvailablePeople();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {loadingPeople ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Buscando pessoas...</p>
                  </div>
                ) : availablePeople.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      {searchPeople ? 'Nenhuma pessoa encontrada' : 'Todas as pessoas já foram registradas'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {availablePeople.map((person: any) => (
                      <div
                        key={person.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{person.full_name}</p>
                          {person.phone && <p className="text-sm text-gray-600">{person.phone}</p>}
                        </div>
                        <button
                          onClick={() => handleAddAttendance(person.id)}
                          disabled={addingMember}
                          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          {addingMember ? 'Adicionando...' : 'Adicionar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lista de Presenças */}
            {attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma presença registrada</p>
            ) : (
              <div className="space-y-2">
                {attendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {attendance.attended ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">{attendance.person.full_name}</h3>
                        {attendance.person.phone && (
                          <p className="text-sm text-gray-600">{attendance.person.phone}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAttendance(attendance.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
