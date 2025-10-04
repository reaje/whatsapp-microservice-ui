import { api } from './api';
import type {
  ProviderStatsMap,
  ProviderHealthResponse,
  RecommendedProviderResponse,
  ProviderType,
} from '@/types/provider.types';

export const providerService = {
  async getStats(): Promise<ProviderStatsMap> {
    const response = await api.get<ProviderStatsMap>('/Provider/stats');
    return response.data;
  },

  async getHealth(providerType: ProviderType): Promise<ProviderHealthResponse> {
    const response = await api.get<ProviderHealthResponse>(
      `/Provider/${providerType}/health`
    );
    return response.data;
  },

  async getStatus(providerType: ProviderType): Promise<unknown> {
    const response = await api.get(`/Provider/${providerType}/status`);
    return response.data;
  },

  async getRecommended(preferredProvider?: string): Promise<RecommendedProviderResponse> {
    const params = preferredProvider ? { preferredProvider } : undefined;
    const response = await api.get<RecommendedProviderResponse>('/Provider/recommended', {
      params,
    });
    return response.data;
  },
};
