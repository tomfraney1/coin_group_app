import { API_URL } from '../config';

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('token');
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  public async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  public async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  public async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  public async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance(); 