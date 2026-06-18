import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { parseVCF, ParsedContact, normalizePhone } from '@/utils/vcfParser';
import { supabase } from '@/services/supabase';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
export default function ImportPeople() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.vcf')) {
      setError('Por favor, selecione um arquivo .vcf');
      return;
    }
    setFile(selectedFile);
    setError('');
    setLoading(true);
    try {
      const content = await selectedFile.text();
      const parsed = parseVCF(content);
      setContacts(parsed);
      // Selecionar todos por padrão
      setSelectedIds(new Set(Array.from({ length: parsed.length }, (_, i) => i)));
      setStep('preview');
    } catch (err) {
      setError('Erro ao processar arquivo VCF');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const toggleContact = (idx: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedIds(newSelected);
  };
  const selectAll = () => {
    setSelectedIds(new Set(Array.from({ length: contacts.length }, (_, i) => i)));
  };
  const clearAll = () => {
    setSelectedIds(new Set());
  };
  const handleImport = async () => {
    if (!selectedIds.size) {
      setError('Selecione pelo menos um contato para importar');
      return;
    }
    setImporting(true);
    setError('');
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
      // Preparar dados para inserção (apenas os selecionados)
      const dataToInsert = contacts
        .map((contact, idx) => ({
          church_id: churchId,
          full_name: contact.full_name,
          phone: contact.phone || null,
          whatsapp: contact.whatsapp || null,
          email: contact.email || null,
          status: 'visitor', // Status padrão para importados
          is_active: true,
        }))
        .filter((_, idx) => selectedIds.has(idx));
      // Inserir em lotes de 100
      const batchSize = 100;
      let inserted = 0;
      for (let i = 0; i < dataToInsert.length; i += batchSize) {
        const batch = dataToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('people')
          .insert(batch);
        if (insertError) {
          console.error('Erro ao inserir lote:', insertError);
          throw insertError;
        }
        inserted += batch.length;
      }
      setSuccess(`✅ ${inserted} contatos importados com sucesso!`);
      setTimeout(() => router.push('/people'), 2000);
      setStep('done');
      setTimeout(() => router.push('/people'), 2000);
    } catch (err) {
      console.error('Erro ao importar:', err);
      setError('Erro ao importar contatos. Verifique os dados e tente novamente.');
    } finally {
      setImporting(false);
    }
  };
  if (!user) return null;
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Importar Contatos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Importe contatos do WhatsApp via arquivo VCF</p>
        </div>
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Selecione seu arquivo VCF
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Exporte seus contatos do Android e faça upload do arquivo .vcf
              </p>
              <input
                type="file"
                accept=".vcf"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
                id="vcf-input"
              />
              <label
                htmlFor="vcf-input"
                className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg cursor-pointer transition-colors"
              >
                {loading ? 'Processando...' : 'Escolher arquivo'}
              </label>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {file && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                <p className="text-blue-700">
                  ✓ Arquivo: <strong>{file.name}</strong> ({contacts.length} contatos encontrados)
                </p>
              </div>
            )}
          </div>
        )}
        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">{selectedIds.size}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Selecionados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">{contacts.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {contacts.filter(c => c.phone).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Com telefone</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {contacts.filter(c => c.email).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Com email</p>
                </div>
              </div>
              {/* Botões de seleção */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={selectAll}
                  className="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  ✓ Selecionar tudo
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  ✗ Desselecionar tudo
                </button>
              </div>
            </div>
            {/* Tabela de preview */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-slate-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white w-12">
                        ✓
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Telefone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {contacts.map((contact, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer ${
                          selectedIds.has(idx)
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(idx)}
                            onChange={() => toggleContact(idx)}
                            className="w-5 h-5 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {contact.full_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {contact.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {contact.email || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Botões */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('upload');
                  setContacts([]);
                  setFile(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {importing ? 'Importando...' : '✓ Importar Contatos'}
              </button>
            </div>
          </div>
        )}
        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sucesso!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{success}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecionando para a lista de pessoas...
            </p>
          </div>
        )}
        {/* Botão Voltar */}
        {step !== 'done' && (
          <button
            onClick={() => router.back()}
            className="mt-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}
