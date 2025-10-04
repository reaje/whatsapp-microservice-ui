export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenantName: string;
  clientId: string;
  // Legacy field for compatibility
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  clientId: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}
