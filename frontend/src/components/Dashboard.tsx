import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  UserPlus,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useQuery } from 'react-query';
import { patientsAPI } from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

export default function Dashboard() {
  const { data: patientsData, isLoading } = useQuery(
    'dashboard-stats',
    () => patientsAPI.getPatients({ limit: 5 }),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const stats = [
    {
      name: 'Total de Pacientes',
      value: patientsData?.pagination.total || 0,
      icon: Users,
      color: 'blue',
      change: '+12%',
    },
    {
      name: 'Consultas Hoje',
      value: '8',
      icon: Calendar,
      color: 'green',
      change: '+2',
    },
    {
      name: 'Tratamentos Ativos',
      value: '24',
      icon: Clock,
      color: 'yellow',
      change: '+5',
    },
    {
      name: 'Concluídos Este Mês',
      value: '47',
      icon: CheckCircle,
      color: 'emerald',
      change: '+18%',
    },
  ];

  const recentPatients = patientsData?.patients || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Bem-vindo ao sistema de prontuário eletrônico odontológico
          </p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Paciente
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs último mês</span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Pacientes Recentes
              </h2>
              <Link
                to="/patients"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todos
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {patient.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {patient.phone || 'Telefone não informado'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum paciente cadastrado ainda</p>
                <Link
                  to="/patients/new"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Paciente
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ações Rápidas
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/patients/new"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <h3 className="font-medium text-gray-900">Novo Paciente</h3>
                  <p className="text-sm text-gray-500">
                    Cadastrar um novo paciente no sistema
                  </p>
                </div>
              </Link>

              <Link
                to="/appointments"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h3 className="font-medium text-gray-900">Agenda</h3>
                  <p className="text-sm text-gray-500">
                    Visualizar e gerenciar consultas
                  </p>
                </div>
              </Link>

              <Link
                to="/reports"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-8 h-8 text-purple-600 mr-4" />
                <div>
                  <h3 className="font-medium text-gray-900">Relatórios</h3>
                  <p className="text-sm text-gray-500">
                    Gerar relatórios e estatísticas
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Status do Sistema</h2>
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Sistema Online</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-700">Banco de Dados</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-700">Backup Automático</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-700">Segurança LGPD</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}