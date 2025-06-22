const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('dental_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
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

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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

    const response = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      patients: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/patients?${queryParams}`);
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
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<any[]>(`/treatments/patient/${patientId}?${queryParams}`);
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
  ) {
    const response = await fetch(`${API_BASE_URL}/pdf/patient/${patientId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    return response.blob();
  }
}

export const authAPI = new ApiClient();
export const patientsAPI = new ApiClient();
export const treatmentsAPI = new ApiClient();
export const pdfAPI = new ApiClient();

export default new ApiClient();