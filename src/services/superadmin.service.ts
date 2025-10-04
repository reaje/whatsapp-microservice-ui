import { api, handleApiError } from './api';
import type {
  Tenant,
  SuperAdminUser,
  CreateTenantRequest,
  CreateTenantResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateTenantSettingsRequest,
} from '@/types/superadmin.types';

export const superAdminService = {
  // ================== TENANT MANAGEMENT ==================

  async getAllTenants(): Promise<Tenant[]> {
    try {
      const response = await api.get<Tenant[]>('/SuperAdmin/tenants');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getTenant(tenantId: string): Promise<Tenant> {
    try {
      const response = await api.get<Tenant>(`/SuperAdmin/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async createTenant(data: CreateTenantRequest): Promise<CreateTenantResponse> {
    try {
      const response = await api.post<CreateTenantResponse>('/SuperAdmin/tenants', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateTenantSettings(tenantId: string, data: UpdateTenantSettingsRequest): Promise<Tenant> {
    try {
      const response = await api.put<Tenant>(`/SuperAdmin/tenants/${tenantId}/settings`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async deleteTenant(tenantId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`/SuperAdmin/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ================== USER MANAGEMENT ==================

  async getAllUsers(): Promise<SuperAdminUser[]> {
    try {
      const response = await api.get<SuperAdminUser[]>('/SuperAdmin/users');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getTenantUsers(tenantId: string): Promise<SuperAdminUser[]> {
    try {
      const response = await api.get<SuperAdminUser[]>(`/SuperAdmin/tenants/${tenantId}/users`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getUser(userId: string): Promise<SuperAdminUser> {
    try {
      const response = await api.get<SuperAdminUser>(`/SuperAdmin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async createUser(tenantId: string, data: CreateUserRequest): Promise<SuperAdminUser> {
    try {
      const response = await api.post<SuperAdminUser>(`/SuperAdmin/tenants/${tenantId}/users`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<SuperAdminUser> {
    try {
      const response = await api.put<SuperAdminUser>(`/SuperAdmin/users/${userId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`/SuperAdmin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
