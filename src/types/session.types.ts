export type ProviderType = 0 | 1; // 0 = Baileys, 1 = Meta API

export const ProviderTypeEnum = {
  Baileys: 0,
  MetaApi: 1,
} as const;

export const ProviderTypeLabels = {
  [ProviderTypeEnum.Baileys]: 'baileys',
  [ProviderTypeEnum.MetaApi]: 'meta_api',
} as const;

export type SessionStatus = 'connected' | 'disconnected' | 'connecting' | 'not_found';

export interface Session {
  id: string;
  phoneNumber: string;
  provider: ProviderType;
  isActive: boolean;
  status: SessionStatus;
  connectedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitializeSessionRequest {
  phoneNumber: string;
  providerType: ProviderType;
}

export interface SessionStatusResponse {
  isConnected: boolean;
  phoneNumber: string | null;
  status: string;
  connectedAt?: string | null;
  metadata?: Record<string, any> | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeResponse {
  qrCode: string;
}
