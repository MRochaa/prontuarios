import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  Edit,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { patientsAPI, treatmentsAPI, pdfAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadingPDF, setLoadingPDF] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery(
    ['patient', id],
    () => patientsAPI.getPatient(id!),
    {
      enabled: Boolean(id)
    }
  );

  const { data: treatments, isLoading: treatmentsLoading } = useQuery(
    ['patient-treatments', id],
    () => treatmentsAPI.getPatientTreatments(id!, { limit: 10 }),
    {
      enabled: Boolean(id)
    }
  );

  const handleGeneratePDF = async () => {
    if (!patient) return;
    
    setLoadingPDF(true);
    try {
      const pdfBlob = await pdfAPI.generatePatientPDF(patient.id, {
        includeSignatures: true
      });
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario_${patient.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleDelete = async () => {
    if (!patient) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${patient.name}?`)) {
      try {
        await patientsAPI.deletePatient(patient.id);
        toast.success('Paciente excluído com sucesso');
        navigate('/patients');
      } catch (error: any) {
        toast.error(error.message || 'Erro ao excluir paciente');
      }
    }
  };

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Paciente não encontrado
        </h2>
        <p className="text-gray-600 mb-6">
          O paciente solicitado não foi encontrado ou foi removido.
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

  const formatAddress = (address: any) => {
    if (!address) return 'Não informado';
    
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Não informado';
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-600">Detalhes do paciente e histórico de tratamentos</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleGeneratePDF}
            disabled={loadingPDF}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            {loadingPDF ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Gerar PDF
          </button>
          <Link
            to={`/patients/${patient.id}/edit`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Photo and Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {patient.photo_url ? (
                  <img
                    src={patient.photo_url}
                    alt={patient.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-blue-600" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {patient.name}
              </h2>
              <p className="text-gray-600">
                Paciente desde {new Date(patient.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações de Contato
            </h3>
            <div className="space-y-3">
              {patient.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{patient.email}</span>
                </div>
              )}
              {patient.birth_date && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">
                    {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <span className="text-gray-900">{formatAddress(patient.address)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações Adicionais
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">CPF:</span>
                <p className="text-gray-900">{patient.cpf || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Consentimento LGPD:</span>
                <p className="text-gray-900">
                  {patient.consent_date 
                    ? new Date(patient.consent_date).toLocaleDateString('pt-BR')
                    : 'Não registrado'
                  }
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Cadastrado por:</span>
                <p className="text-gray-900">{patient.created_by_name || 'Sistema'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Treatments History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Histórico de Tratamentos
                </h3>
                <Link
                  to={`/patients/${patient.id}/treatments/new`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tratamento
                </Link>
              </div>
            </div>

            <div className="p-6">
              {treatmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : treatments && treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.map((treatment) => (
                    <Link
                      key={treatment.id}
                      to={`/treatments/${treatment.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {treatment.procedure}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(treatment.status)}`}>
                              {getStatusText(treatment.status)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(treatment.date).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(treatment.date).toLocaleTimeString('pt-BR')}
                          </div>

                          {treatment.teeth && treatment.teeth.length > 0 && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <span className="font-medium mr-2">Dentes:</span>
                              {treatment.teeth.map((tooth: number) => (
                                <span
                                  key={tooth}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
                                >
                                  {tooth}
                                </span>
                              ))}
                            </div>
                          )}

                          {treatment.observations && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {treatment.observations}
                            </p>
                          )}

                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <User className="w-4 h-4 mr-1" />
                            Dr(a). {treatment.dentist_name}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {treatment.signature && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {treatment.photos && treatment.photos.length > 0 && (
                            <FileText className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}

                  <div className="text-center pt-4">
                    <Link
                      to={`/patients/${patient.id}/treatments`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Ver todos os tratamentos
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum tratamento registrado
                  </h4>
                  <p className="text-gray-500 mb-6">
                    Comece registrando o primeiro tratamento deste paciente.
                  </p>
                  <Link
                    to={`/patients/${patient.id}/treatments/new`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Tratamento
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}