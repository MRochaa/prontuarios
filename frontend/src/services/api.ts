const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('dental_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usa a mensagem padrão
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de rede ou servidor');
    }
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    method: string = 'POST'
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('dental_token');
    
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usa a mensagem padrão
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao enviar dados');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Patient endpoints
  async getPatients(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/patients?${queryString}` : '/patients';
    
    return this.request<{
      patients: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getPatient(id: string) {
    return this.request<any>(`/patients/${id}`);
  }

  async createPatient(formData: FormData) {
    return this.requestFormData<any>('/patients', formData);
  }

  async updatePatient(id: string, formData: FormData) {
    return this.requestFormData<any>(`/patients/${id}`, formData, 'PUT');
  }

  async deletePatient(id: string) {
    return this.request(`/patients/${id}`, { method: 'DELETE' });
  }

  async exportPatientData(id: string) {
    return this.request<any>(`/patients/${id}/export`);
  }

  // Treatment endpoints
  async getPatientTreatments(
    patientId: string,
    params: {
      page?: number;
      limit?: number;
      tooth?: number;
      procedure?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/treatments/patient/${patientId}?${queryString}` 
      : `/treatments/patient/${patientId}`;
    
    return this.request<any[]>(endpoint);
  }

  async getTreatment(id: string) {
    return this.request<any>(`/treatments/${id}`);
  }

  async createTreatment(formData: FormData) {
    return this.requestFormData<any>('/treatments', formData);
  }

  async updateTreatment(id: string, formData: FormData) {
    return this.requestFormData<any>(`/treatments/${id}`, formData, 'PUT');
  }

  async deleteTreatment(id: string) {
    return this.request(`/treatments/${id}`, { method: 'DELETE' });
  }

  async getProcedures() {
    return this.request<{ name: string; category: string }[]>('/treatments/procedures/list');
  }

  // PDF endpoints
  async generatePatientPDF(
    patientId: string,
    options: {
      dateFrom?: string;
      dateTo?: string;
      includeSignatures?: boolean;
    } = {}
  ): Promise<Blob> {
    const token = localStorage.getItem('dental_token');
    
    const response = await fetch(`${API_BASE_URL}/pdf/patient/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Falha ao gerar PDF');
    }

    return response.blob();
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Instâncias compartilhadas
const apiClient = new ApiClient();

export const authAPI = apiClient;
export const patientsAPI = apiClient;
export const treatmentsAPI = apiClient;
export const pdfAPI = apiClient;

export default apiClient;
