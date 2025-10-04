import { api } from './api';
import { AUTH_TOKEN_KEY, CLIENT_ID_KEY, USER_KEY } from '@/utils/constants';
import type { LoginCredentials, LoginResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/Auth/login', credentials);

    const { token, user } = response.data;

    // Store credentials (use clientId from response if available, otherwise from request)
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(CLIENT_ID_KEY, user.clientId || credentials.clientId);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return response.data;
  },

  async validateToken(token: string): Promise<User> {
    const response = await api.get<User>('/Auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CLIENT_ID_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  getStoredClientId(): string | null {
    return localStorage.getItem(CLIENT_ID_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredClientId();
  },
};
