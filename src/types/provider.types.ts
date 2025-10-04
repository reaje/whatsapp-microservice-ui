export enum ProviderType {
  Baileys = 0,
  MetaApi = 1,
}

export interface ProviderStats {
  providerType: ProviderType;
  isHealthy: boolean;
  totalSessions: number;
  activeSessions: number;
  messagesSentToday: number;
  lastHealthCheck: string;
  averageResponseTime: string;
  successRate: number;
}

export interface ProviderHealthResponse {
  providerType: ProviderType;
  isHealthy: boolean;
  checkedAt: string;
  message: string;
}

export interface RecommendedProviderResponse {
  providerType: ProviderType;
  isHealthy: boolean;
  reason: string;
}

export interface ProviderStatsMap {
  [key: string]: ProviderStats;
}
