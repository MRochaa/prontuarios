import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { Save, ArrowLeft, Upload, X, FileSignature as Signature } from 'lucide-react';
import { treatmentsAPI, patientsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import SignatureCanvas from '../common/SignatureCanvas';
import Odontogram from '../common/Odontogram';
import toast from 'react-hot-toast';

interface TreatmentFormData {
  patient_id: string;
  teeth: number[];
  procedure: string;
  observations: string;
  status: 'in_progress' | 'completed';
}

export default function TreatmentForm() {
  const { id, patientId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [showSignature, setShowSignature] = useState(false);

  const isEditing = Boolean(id);

  const { data: patient } = useQuery(
    ['patient', patientId],
    () => patientsAPI.getPatient(patientId!),
    {
      enabled: Boolean(patientId)
    }
  );

  useQuery(
    ['treatment', id],
    () => treatmentsAPI.getTreatment(id!),
    {
      enabled: isEditing,
      onSuccess: (data) => {
        reset({
          patient_id: data.patient_id,
          teeth: data.teeth || [],
          procedure: data.procedure || '',
          observations: data.observations || '',
          status: data.status || 'in_progress'
        });
        setSelectedTeeth(data.teeth || []);
        if (data.signature) {
          setSignature(data.signature);
        }
      }
    }
  );

  const { data: procedures } = useQuery(
    'procedures',
    () => treatmentsAPI.getProcedures()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<TreatmentFormData>({
    defaultValues: {
      patient_id: patientId || '',
      teeth: [],
      procedure: '',
      observations: '',
      status: 'in_progress'
    }
  });

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (photos.length + files.length > 5) {
      toast.error('Máximo de 5 fotos permitidas');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} é muito grande (máximo 10MB)`);
        return false;
      }
      return true;
    });

    setPhotos(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotosPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleTeethSelect = (teeth: number[]) => {
    setSelectedTeeth(teeth);
    setValue('teeth', teeth);
  };

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignature(false);
  };

  const onSubmit = async (data: TreatmentFormData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add treatment data
      formData.append('patient_id', data.patient_id);
      formData.append('teeth', JSON.stringify(selectedTeeth));
      formData.append('procedure', data.procedure);
      formData.append('observations', data.observations);
      formData.append('status', data.status);

      // Add signature if present
      if (signature) {
        formData.append('signature', signature);
      }

      // Add photos
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      if (isEditing) {
        await treatmentsAPI.updateTreatment(id!, formData);
        toast.success('Tratamento atualizado com sucesso!');
      } else {
        await treatmentsAPI.createTreatment(formData);
        toast.success('Tratamento registrado com sucesso!');
      }

      navigate(`/patients/${data.patient_id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar tratamento');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Tratamento' : 'Novo Tratamento'}
          </h1>
          <p className="text-gray-600">
            {patient && `Paciente: ${patient.name}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Odontogram */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Seleção de Dentes
          </h2>
          <Odontogram
            selectedTeeth={selectedTeeth}
            onTeethSelect={handleTeethSelect}
          />
          <p className="text-sm text-gray-500 mt-2">
            Clique nos dentes para selecioná-los. Dentes selecionados: {selectedTeeth.join(', ') || 'Nenhum'}
          </p>
        </div>

        {/* Treatment Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhes do Tratamento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="procedure" className="block text-sm font-medium text-gray-700 mb-2">
                Procedimento *
              </label>
              <input
                type="text"
                id="procedure"
                list="procedures-list"
                {...register('procedure', { required: 'Procedimento é obrigatório' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite ou selecione um procedimento"
              />
              <datalist id="procedures-list">
                {procedures?.map((proc) => (
                  <option key={proc.name} value={proc.name} />
                ))}
              </datalist>
              {errors.procedure && (
                <p className="mt-1 text-sm text-red-600">{errors.procedure.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                id="observations"
                rows={4}
                {...register('observations')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva detalhes do procedimento, observações clínicas, etc."
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fotos e Anexos
          </h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Fotos
              </button>
              <span className="text-sm text-gray-500">
                Máximo 5 fotos, até 10MB cada
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photosPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {photosPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Digital Signature */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assinatura Digital
          </h2>

          <div className="space-y-4">
            {signature ? (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img
                    src={signature}
                    alt="Assinatura"
                    className="max-w-full h-20 object-contain"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSignature(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Signature className="w-4 h-4 mr-2" />
                    Refazer Assinatura
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignature('')}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignature(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Signature className="w-4 h-4 mr-2" />
                Adicionar Assinatura
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Signature Modal */}
      {showSignature && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onCancel={() => setShowSignature(false)}
        />
      )}
    </div>
  );
}