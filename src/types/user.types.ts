export interface User {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'Admin' | 'User';
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: 'Admin' | 'User';
  isActive?: boolean;
}

export interface UpdatePasswordRequest {
  newPassword: string;
}
