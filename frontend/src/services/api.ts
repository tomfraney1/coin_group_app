import { API_URL } from '../config';

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    this.token = localStorage.getItem('token');
    console.log('API Service initialized with base URL:', this.baseUrl);
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
      console.log('Adding token to headers:', { token: this.token.substring(0, 10) + '...' });
    } else {
      console.log('No token available for headers');
    }

    return headers;
  }

  public setToken(token: string) {
    console.log('Setting token:', { token: token.substring(0, 10) + '...' });
    this.token = token;
    localStorage.setItem('token', token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });

      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.replace(/^\/api/, '');
    const url = `${this.baseUrl}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
    
    console.log('Making API request:', {
      url,
      method: options.method || 'GET',
      headers: this.getHeaders()
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  public async login(email: string, password: string) {
    const { token } = await this.request<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Set token and wait a moment to ensure it's set
    this.setToken(token);
    
    // Get current user with the new token
    const { user } = await this.request<{ user: any }>('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return { token, user };
  }

  public async register(email: string, password: string, username: string) {
    const { token } = await this.request<{ token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    
    // Set token and wait a moment to ensure it's set
    this.setToken(token);
    
    // Get current user with the new token
    const { user } = await this.request<{ user: any }>('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return { token, user };
  }

  // User endpoints
  public async getCurrentUser() {
    return this.request<{ user: any }>('/api/users/me');
  }

  public async updateUser(userId: string, data: any) {
    return this.request<{ user: any }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = ApiService.getInstance(); 