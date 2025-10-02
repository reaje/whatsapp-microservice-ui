import { api, handleApiError } from './api';
import type { Tenant, TenantSettings } from '@/types';

export const tenantService = {
  async getSettings(): Promise<Tenant> {
    try {
      const response = await api.get<Tenant>('/tenant/settings');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateSettings(settings: TenantSettings): Promise<Tenant> {
    try {
      const response = await api.put<Tenant>('/tenant/settings', { settings });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getAll(): Promise<Tenant[]> {
    try {
      const response = await api.get<Tenant[]>('/tenant');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
