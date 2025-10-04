import type { Tenant, TenantSettings } from './tenant.types';

export interface SuperAdminUser {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  settings?: TenantSettings;
}

export interface CreateTenantResponse {
  tenantId: string;
  clientId: string;
  message: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateTenantSettingsRequest {
  settings: TenantSettings;
}

export { Tenant };
