import { api, handleApiError } from './api';
import type { Tenant, TenantSettings } from '@/types';

export const tenantService = {
  async getSettings(): Promise<Tenant> {
    try {
      const response = await api.get<Tenant>('/tenant/settings');
      return this.mapTenantResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateSettings(settings: TenantSettings): Promise<Tenant> {
    try {
      const response = await api.put<Tenant>('/tenant/settings', { settings });
      return this.mapTenantResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getAll(): Promise<Tenant[]> {
    try {
      const response = await api.get<Tenant[]>('/tenant');
      return response.data.map(this.mapTenantResponse);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Helper to ensure dates are properly typed
  mapTenantResponse(response: Tenant): Tenant {
    return {
      ...response,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  },
};
