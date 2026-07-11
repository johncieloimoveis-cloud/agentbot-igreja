import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { PersonForm, PersonFormData } from '@/components/features/people/PersonForm';
import { getPerson, updatePerson, deletePerson, getPersonRelationships, addPersonRelationship, removePersonRelationship, getPeopleWithAddress, RELATIONSHIP_LABELS } from '@/services/people';
import { AlertCircle, Trash2, Sparkles, MessageCircle, X, Copy, Check, KeyRound, UserPlus, Users, MapPin, ExternalLink, Plus } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

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
  lat?: number;
  lon?: number;
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

  // Familia
  const [relationships, setRelationships] = useState<any[]>([]);
  const [showAddRel, setShowAddRel] = useState(false);
  const [relSearch, setRelSearch] = useState('');
  const [relSearchResults, setRelSearchResults] = useState<any[]>([]);
  const [relSelectedPerson, setRelSelectedPerson] = useState<any>(null);
  const [relType, setRelType] = useState('conjuge');
  const [savingRel, setSavingRel] = useState(false);
  const [relError, setRelError] = useState('');
  const [allPeople, setAllPeople] = useState<any[]>([]);

  // Mapa do endereco
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapError, setMapError] = useState('');

  // Login state
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<{ username: string; email: string; password: string } | null>(null);
  const [loginError, setLoginError] = useState('');
  const [copiedLogin, setCopiedLogin] = useState(false);

  const handleCreateLogin = async () => {
    if (!person) return;
    setCreatingLogin(true);
    setLoginError('');
    setLoginCredentials(null);
    try {
      const res = await fetchWithAuth('/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({ personId: person.id, personName: person.full_name, oficialPosition: person.oficial }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Já tem login — mostrar email existente sem senha (não temos a senha)
        setLoginCredentials({ username: '', email: data.email, password: '' });
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setLoginCredentials(data);
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao criar login');
    } finally {
      setCreatingLogin(false);
    }
  };

  const buildLoginWhatsApp = () => {
    if (!loginCredentials || !person) return '';
    const phone = (person.whatsapp || person.phone || '').replace(/\D/g, '');
    const msg = `Olá ${person.full_name.split(' ')[0]}! Seu acesso ao sistema foi criado:\n\n🔑 Login: ${loginCredentials.email}\n🔒 Senha: ${loginCredentials.password}\n\nAcesse em: agentbot-igreja.vercel.app\n\nNo primeiro acesso você será solicitado a criar uma senha pessoal.`;
    const encoded = encodeURIComponent(msg);
    return phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  // IA states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessageType, setAiMessageType] = useState('checkin');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [weeksAbsent, setWeeksAbsent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (msg: string) => {
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!id || !user) return;
    loadPerson();
    loadRelationships();
  }, [id, user]);

  useEffect(() => {
    if (!relSearch.trim() || relSearch.length < 2) { setRelSearchResults([]); return; }
    const q = relSearch.toLowerCase();
    setRelSearchResults(allPeople.filter((p) => p.full_name.toLowerCase().includes(q) && p.id !== id).slice(0, 8));
  }, [relSearch, allPeople, id]);

  const loadRelationships = async () => {
    if (!id) return;
    const { data } = await getPersonRelationships(id as string);
    setRelationships(data ?? []);
  };

  const loadAllPeople = async () => {
    if (allPeople.length > 0 || !person) return;
    const churchId = (person as any).church_id;
    const { data } = await getPeopleWithAddress(churchId);
    setAllPeople(data ?? []);
  };

  const handleAddRelationship = async () => {
    if (!relSelectedPerson || !person) return;
    setSavingRel(true);
    setRelError('');
    try {
      const { error: err } = await addPersonRelationship(
        (person as any).church_id,
        person.id,
        relSelectedPerson.id,
        relType
      );
      if (err) throw err;
      await loadRelationships();
      setShowAddRel(false);
      setRelSelectedPerson(null);
      setRelSearch('');
      setRelType('conjuge');
    } catch (err: any) {
      setRelError(err.message || 'Erro ao salvar vinculo');
    } finally {
      setSavingRel(false);
    }
  };

  const handleRemoveRelationship = async (rel: any) => {
    await removePersonRelationship(rel.id, id as string, rel.related_person_id, rel.relationship_type);
    await loadRelationships();
  };

  const geocodeAddress = () => {
    if (!person) return;
    if (!person.address && !(person as any).city) {
      setMapError('Endereco nao cadastrado.');
      return;
    }
    setMapError('');
    setShowMap(true);
  };

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

  const geocodeForSave = async (address: string, city: string): Promise<{ lat: number; lon: number } | null> => {
    // Usa /api/geocode (Google Maps server-side) quando GOOGLE_MAPS_KEY estiver configurada.
    // Sem a key o endpoint retorna 503 e caímos no fallback Nominatim.
    try {
      const params = new URLSearchParams();
      if (address) params.set('address', address);
      if (city)    params.set('city', city);
      const res = await fetch(`/api/geocode?${params}`);
      if (res.ok) {
        const { lat, lon } = await res.json();
        if (lat && lon) return { lat, lon };
      }
    } catch { /* fallback abaixo */ }

    // Fallback: Nominatim estruturado (menos preciso, mas sem chave)
    const BASE = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br';
    const HEADERS = { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'SheepCare/1.0' };
    const attempts: string[] = [];
    if (address && city) {
      attempts.push(`${BASE}&street=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}`);
      attempts.push(`${BASE}&q=${encodeURIComponent(`${address}, ${city}`)}`);
    } else if (address) {
      attempts.push(`${BASE}&q=${encodeURIComponent(address)}`);
    }
    if (city) attempts.push(`${BASE}&q=${encodeURIComponent(city)}`);

    for (const url of attempts) {
      try {
        const r = await fetch(url, { headers: HEADERS });
        const d = await r.json();
        if (Array.isArray(d) && d.length > 0) {
          return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) };
        }
      } catch { /* ignora */ }
    }
    return null;
  };

  const handleSubmit = async (data: PersonFormData) => {
    if (!person) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const addressChanged =
        (data.address ?? '') !== (person.address ?? '') ||
        (data.city ?? '') !== (person.city ?? '');
      const needsGeocode = addressChanged || (!person.lat && (data.address || data.city));

      let coords: { lat: number; lon: number } | null = null;
      if (needsGeocode && (data.address || data.city)) {
        coords = await geocodeForSave(data.address ?? '', data.city ?? '');
      }

      const cleanData: any = {
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
      if (needsGeocode) {
        cleanData.lat = coords?.lat ?? null;
        cleanData.lon = coords?.lon ?? null;
      }

      const { error: err } = await updatePerson(person.id, cleanData);
      if (err) throw err;
      setSuccess('Pessoa atualizada com sucesso!');
      setTimeout(() => router.back(), 1500);
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
          <div className="flex gap-2">
            <button
              onClick={handleCreateLogin}
              disabled={creatingLogin}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              {creatingLogin ? 'Criando...' : 'Criar Login'}
            </button>
            <button
              onClick={() => { setShowAiModal(true); setAiMessage(''); setAiError(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Mensagem IA
            </button>
          </div>
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

        {/* Credenciais criadas */}
        {loginError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{loginError}</p>
          </div>
        )}
        {loginCredentials && (
          <div className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Login criado com sucesso!</span>
              </div>
              <button
                onClick={() => setLoginCredentials(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="text-gray-500 dark:text-gray-400">Login:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{loginCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="text-gray-500 dark:text-gray-400">Senha provisória:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{loginCredentials.password}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Login: ${loginCredentials.email}\nSenha: ${loginCredentials.password}`);
                  setCopiedLogin(true);
                  setTimeout(() => setCopiedLogin(false), 2000);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors text-sm"
              >
                {copiedLogin ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedLogin ? 'Copiado!' : 'Copiar'}
              </button>
              <a
                href={buildLoginWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Secao Familia */}
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Familia</h2>
            </div>
            <button
              onClick={() => { setShowAddRel(true); setRelError(''); loadAllPeople(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
          {relationships.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum vinculo cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => (
                <div key={rel.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-slate-100 text-sm">{rel.related?.full_name}</span>
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {RELATIONSHIP_LABELS[rel.relationship_type] ?? rel.relationship_type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveRelationship(rel)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover vinculo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {showAddRel && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Buscar pessoa</label>
                <input
                  type="text"
                  value={relSearch}
                  onChange={(e) => { setRelSearch(e.target.value); setRelSelectedPerson(null); }}
                  placeholder="Digite o nome..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                />
                {relSearchResults.length > 0 && !relSelectedPerson && (
                  <div className="mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {relSearchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setRelSelectedPerson(p); setRelSearch(p.full_name); setRelSearchResults([]); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        {p.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo de vinculo</label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              {relError && <p className="text-xs text-red-500">{relError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleAddRelationship}
                  disabled={!relSelectedPerson || savingRel}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {savingRel ? 'Salvando...' : 'Salvar vinculo'}
                </button>
                <button
                  onClick={() => { setShowAddRel(false); setRelSearch(''); setRelSelectedPerson(null); }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mapa do endereco */}
        {(person.address || (person as any).city) && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Localizacao</h2>
              </div>
              <div className="flex gap-2">
                {!showMap && (
                  <button
                    onClick={geocodeAddress}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver no Mapa
                  </button>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([person.address, (person as any).city, 'Brasil'].filter(Boolean).join(', '))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Maps
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {[person.address, (person as any).city].filter(Boolean).join(' - ')}
            </p>
            {mapError && <p className="text-sm text-red-500">{mapError}</p>}
            {showMap && (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                <iframe
                  title="Mapa do endereco"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent([person.address, (person as any).city, 'Brasil'].filter(Boolean).join(', '))}&output=embed`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(aiMessage)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                      <button
                        onClick={handleSendWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </div>
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
