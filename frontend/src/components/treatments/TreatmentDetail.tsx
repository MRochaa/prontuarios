import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { treatmentsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function TreatmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: treatment, isLoading } = useQuery(
    ['treatment', id],
    () => treatmentsAPI.getTreatment(id!),
    {
      enabled: Boolean(id)
    }
  );

  const handleDelete = async () => {
    if (!treatment) return;
    
    if (window.confirm('Tem certeza que deseja excluir este tratamento?')) {
      try {
        await treatmentsAPI.deleteTreatment(treatment.id);
        toast.success('Tratamento excluído com sucesso');
        navigate(`/patients/${treatment.patient_id}`);
      } catch (error: any) {
        toast.error(error.message || 'Erro ao excluir tratamento');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em andamento';
      default:
        return 'Não definido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Tratamento não encontrado
        </h2>
        <p className="text-gray-600 mb-6">
          O tratamento solicitado não foi encontrado ou foi removido.
        </p>
        <Link
          to="/patients"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Pacientes
        </Link>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(treatment.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/patients/${treatment.patient_id}`)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{treatment.procedure}</h1>
            <p className="text-gray-600">
              Paciente: {treatment.patient_name} • {new Date(treatment.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/treatments/${treatment.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </button>
        </div>
      </div>

      {/* Treatment Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações do Tratamento
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-4 h-4" />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(treatment.status)}`}>
                      {getStatusText(treatment.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Data e Hora:</span>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(treatment.date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(treatment.date).toLocaleTimeString('pt-BR')}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Dentista:</span>
                  <div className="flex items-center text-gray-900">
                    <User className="w-4 h-4 mr-1" />
                    Dr(a). {treatment.dentist_name}
                  </div>
                </div>

                {treatment.teeth && treatment.teeth.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">Dentes Envolvidos:</span>
                    <div className="flex flex-wrap gap-1">
                      {treatment.teeth.map((tooth: number) => (
                        <span
                          key={tooth}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {tooth}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações do Paciente
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <Link
                  to={`/patients/${treatment.patient_id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {treatment.patient_name}
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  Clique para ver o prontuário completo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      {treatment.observations && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Observações
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{treatment.observations}</p>
          </div>
        </div>
      )}

      {/* Photos */}
      {treatment.photos && treatment.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Fotos e Anexos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {treatment.photos.map((photo: any, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={photo.path}
                  alt={photo.originalName}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => window.open(photo.path, '_blank')}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate" title={photo.originalName}>
                  {photo.originalName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Signature */}
      {treatment.signature && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assinatura Digital
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <img
              src={treatment.signature}
              alt="Assinatura Digital"
              className="max-w-full h-20 object-contain mb-2"
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Assinado digitalmente</span>
              {treatment.signature_hash && (
                <span className="font-mono text-xs">
                  Hash: {treatment.signature_hash.substring(0, 16)}...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informações do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Criado em:</span>
            <p className="text-gray-900">
              {new Date(treatment.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          {treatment.updated_at !== treatment.created_at && (
            <div>
              <span className="font-medium text-gray-500">Última atualização:</span>
              <p className="text-gray-900">
                {new Date(treatment.updated_at).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}