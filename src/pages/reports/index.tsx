import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import {
  getPersonByStatusReport,
  getVisitorsReport,
  getFrequencyReport,
  getMinistriesReport,
  getGroupsReport,
  exportToCSV,
} from '@/services/reports';
import { Download, Users, Calendar, Heart, Users2 } from 'lucide-react';

export default function Reports() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('people-status');

  const [peopleByStatus, setPeopleByStatus] = useState<any>({});
  const [visitors, setVisitors] = useState<any[]>([]);
  const [frequency, setFrequency] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) return;
    loadReport();
  }, [user, reportType, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const churchId = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';

      switch (reportType) {
        case 'people-status': {
          const res = await getPersonByStatusReport(churchId);
          if (res.data) setPeopleByStatus(res.data);
          break;
        }
        case 'visitors': {
          const res = await getVisitorsReport(churchId, startDate, endDate);
          if (res.data) setVisitors(res.data);
          break;
        }
        case 'frequency': {
          const res = await getFrequencyReport(churchId);
          if (res.data) setFrequency(res.data);
          break;
        }
        case 'ministries': {
          const res = await getMinistriesReport(churchId);
          if (res.data) setMinistries(res.data);
          break;
        }
        case 'groups': {
          const res = await getGroupsReport(churchId);
          if (res.data) setGroups(res.data);
          break;
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    let data = [];
    let filename = '';

    switch (reportType) {
      case 'people-status':
        data = Object.values(peopleByStatus).flat();
        filename = 'relatorio_pessoas_por_status';
        break;
      case 'visitors':
        data = visitors;
        filename = 'relatorio_visitantes';
        break;
      case 'frequency':
        data = frequency;
        filename = 'relatorio_frequencia';
        break;
      case 'ministries':
        data = ministries;
        filename = 'relatorio_ministerios';
        break;
      case 'groups':
        data = groups;
        filename = 'relatorio_grupos';
        break;
    }

    exportToCSV(data, filename);
  };

  if (!user) return null;

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      visitor: '👤 Visitante',
      active_member: '✅ Membro Ativo',
      new_convert: '🆕 Novo Convertido',
      in_discipleship: '📖 Em Discipulado',
      absent: '❌ Afastado',
      transferred: '↔️ Transferido',
      leader: '👑 Liderança',
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-slate-100 mb-6">
        ← Voltar
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">Relatórios 📊</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Gere relatórios e exporte dados da sua church</p>
      </div>

      {/* Seletor de Relatório */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-8">
        {[
          { id: 'people-status', label: 'Pessoas', icon: Users },
          { id: 'visitors', label: 'Visitantes', icon: Users2 },
          { id: 'frequency', label: 'Frequência', icon: Calendar },
          { id: 'ministries', label: 'Ministérios', icon: Heart },
          { id: 'groups', label: 'Grupos', icon: Users2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setReportType(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              reportType === id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700 hover:border-primary-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      {reportType === 'visitors' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Botão de Exportação */}
      {!loading && (
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg mb-6"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      )}

      {/* Relatório */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando relatório...</p>
        </div>
      ) : reportType === 'people-status' ? (
        <div className="space-y-4">
          {Object.entries(peopleByStatus).map(([status, persons]: any) => (
            <div key={status} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">{getStatusLabel(status)}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-2 px-4">Nome</th>
                      <th className="text-left py-2 px-4">Email</th>
                      <th className="text-left py-2 px-4">Telefone</th>
                      <th className="text-left py-2 px-4">Data Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((person: any) => (
                      <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50 dark:bg-slate-700">
                        <td className="py-2 px-4">{person.full_name}</td>
                        <td className="py-2 px-4">{person.email || '-'}</td>
                        <td className="py-2 px-4">{person.phone || '-'}</td>
                        <td className="py-2 px-4">
                          {new Date(person.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">Total: {persons.length} pessoas</p>
            </div>
          ))}
        </div>
      ) : reportType === 'visitors' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Nome</th>
                <th className="text-left py-3 px-6 font-semibold">Email</th>
                <th className="text-left py-3 px-6 font-semibold">Telefone</th>
                <th className="text-left py-3 px-6 font-semibold">WhatsApp</th>
                <th className="text-left py-3 px-6 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="border-b hover:bg-gray-50 dark:bg-slate-700">
                  <td className="py-3 px-6">{visitor.full_name}</td>
                  <td className="py-3 px-6">{visitor.email || '-'}</td>
                  <td className="py-3 px-6">{visitor.phone || '-'}</td>
                  <td className="py-3 px-6">{visitor.whatsapp || '-'}</td>
                  <td className="py-3 px-6">{new Date(visitor.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 dark:bg-slate-700 text-sm text-gray-600 dark:text-gray-400">
            Total: {visitors.length} visitantes
          </div>
        </div>
      ) : reportType === 'frequency' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Evento</th>
                <th className="text-left py-3 px-6 font-semibold">Tipo</th>
                <th className="text-left py-3 px-6 font-semibold">Data</th>
                <th className="text-left py-3 px-6 font-semibold">Presenças</th>
              </tr>
            </thead>
            <tbody>
              {frequency.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50 dark:bg-slate-700">
                  <td className="py-3 px-6 font-medium">{event.name}</td>
                  <td className="py-3 px-6">{event.event_type}</td>
                  <td className="py-3 px-6">{new Date(event.event_date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-6 font-semibold">{event.total_attended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : reportType === 'ministries' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <div key={ministry.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{ministry.name}</h3>
              <p className="text-3xl font-bold text-primary-600 mt-4">{ministry.total_members}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">membros</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{group.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {group.meeting_day} às {group.meeting_time}
              </p>
              <p className="text-3xl font-bold text-primary-600 mt-4">{group.total_members}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">membros</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
