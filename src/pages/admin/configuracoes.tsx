import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Instagram, Facebook, Youtube, Globe, Phone, MapPin, User, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Image from 'next/image';

interface ChurchConfig {
  name: string;
  logo_url: string;
  instagram: string;
  facebook: string;
  youtube: string;
  website: string;
  whatsapp: string;
  city: string;
  address: string;
  pastor: string;
}

export default function Configuracoes() {
  const { church_id } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<ChurchConfig>({
    name: '', logo_url: '', instagram: '', facebook: '',
    youtube: '', website: '', whatsapp: '', city: '', address: '', pastor: '',
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!church_id) return;
    supabase
      .from('churches')
      .select('name, logo_url, instagram, facebook, youtube, website, whatsapp, city, address, pastor')
      .eq('id', church_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setConfig({
            name: data.name || '',
            logo_url: data.logo_url || '',
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            youtube: data.youtube || '',
            website: data.website || '',
            whatsapp: data.whatsapp || '',
            city: data.city || '',
            address: data.address || '',
            pastor: data.pastor || '',
          });
          if (data.logo_url) setPreview(data.logo_url);
        }
        setLoading(false);
      });
  }, [church_id]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !church_id) return;

    // Preview local imediato
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setErro('');

    const ext = file.name.split('.').pop() || 'png';
    const path = `${church_id}/logo.${ext}`;

    // Garante que o bucket existe (cria se necessário)
    await supabase.storage.createBucket('church-logos', { public: true });

    const { error: upErr } = await supabase.storage
      .from('church-logos')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setErro('Erro no upload da logo: ' + upErr.message + ' — Verifique se o bucket church-logos existe no Supabase Storage.');
      setPreview('');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('church-logos')
      .getPublicUrl(path);

    setConfig(c => ({ ...c, logo_url: publicUrl }));
    setPreview(publicUrl);
    setUploading(false);
  };

  const salvar = async () => {
    setSaving(true);
    setErro('');
    setSaved(false);

    const { ok, error } = await fetchWithAuth('/api/admin/update-church', {
      method: 'PATCH',
      body: JSON.stringify({
        logo_url: config.logo_url,
        instagram: config.instagram,
        facebook: config.facebook,
        youtube: config.youtube,
        website: config.website,
        whatsapp: config.whatsapp,
        city: config.city,
        address: config.address,
        pastor: config.pastor,
      }),
    }).then(r => r.json()).catch(() => ({ error: 'Erro de rede' }));

    if (error) setErro(error);
    else setSaved(true);
    setSaving(false);
  };

  const field = (label: string, key: keyof ChurchConfig, placeholder: string, Icon: React.ElementType) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={config[key] as string}
          onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configura&#231;&#245;es da Igreja</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.name}</p>
      </div>

      {/* Logo */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Logo da Igreja</h2>
        <div className="flex items-center gap-6">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors overflow-hidden bg-gray-50 dark:bg-slate-700 group"
          >
            {preview ? (
              <>
                <img src={preview} alt="Logo" className="w-full h-full object-contain p-1" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                <span className="text-[10px]">{uploading ? 'Enviando...' : 'Clique'}</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Formatos: PNG, JPG, SVG</p>
            <p>Tamanho ideal: 200x200px</p>
            <p className="mt-2 text-xs">A logo aparece no portal p&#250;blico da sua igreja.</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      {/* Redes sociais */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Redes Sociais e Contato</h2>
        {field('Instagram', 'instagram', 'imwibaiti', Instagram)}
        {field('Facebook', 'facebook', 'imwibaiti ou URL completa', Facebook)}
        {field('YouTube', 'youtube', 'canal ou URL completa', Youtube)}
        {field('Site / Website', 'website', 'www.suaigreja.com.br', Globe)}
        {field('WhatsApp', 'whatsapp', '(43) 99999-0000', Phone)}
      </div>

      {/* Informa&#231;&#245;es gerais */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Informa&#231;&#245;es Gerais</h2>
        {field('Cidade', 'city', 'Ibaiti - PR', MapPin)}
        {field('Endereço da igreja', 'address', 'Rua Exemplo, 123 — Bairro', MapPin)}
        {field('Pastor responsável', 'pastor', 'Pr. Nome Sobrenome', User)}
      </div>

      {/* Erro e salvar */}
      {erro && <p className="text-red-500 text-sm">{erro}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Salvo com sucesso!
          </span>
        )}
      </div>
    </div>
  );
}
