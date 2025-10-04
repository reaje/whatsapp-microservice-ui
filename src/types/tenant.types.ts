export interface Tenant {
  id: string;
  clientId: string;
  name: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  max_sessions?: number;
  max_messages_per_day?: number;
  webhook_url?: string | null;
  features?: {
    ai_enabled?: boolean;
    media_enabled?: boolean;
    location_enabled?: boolean;
  };
}

export interface UpdateTenantSettingsRequest {
  settings: TenantSettings;
}
