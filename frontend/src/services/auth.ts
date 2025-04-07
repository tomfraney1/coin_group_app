import { apiService } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {
    // Load user from localStorage on initialization
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiService.register(email, password, username);
    this.handleAuthSuccess(response);
    return response;
  }

  public async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiService.login(email, password);
    this.handleAuthSuccess(response);
    return response;
  }

  private handleAuthSuccess(response: AuthResponse) {
    this.currentUser = response.user;
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  public logout() {
    this.currentUser = null;
    apiService.clearToken();
    localStorage.removeItem('user');
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}

export const authService = AuthService.getInstance(); 