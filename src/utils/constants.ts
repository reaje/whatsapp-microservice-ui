export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5278/api/v1';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const AUTH_TOKEN_KEY = 'auth_token';
export const CLIENT_ID_KEY = 'client_id';
export const USER_KEY = 'user';

export const QUERY_KEYS = {
  SESSIONS: 'sessions',
  SESSION_STATUS: 'session-status',
  MESSAGES: 'messages',
  MESSAGE_STATUS: 'message-status',
  TENANT: 'tenant',
  TENANT_SETTINGS: 'tenant-settings',
} as const;

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

export const SESSION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  NOT_FOUND: 'not_found',
} as const;

export const PROVIDER_TYPES = {
  BAILEYS: 'baileys',
  META_API: 'meta_api',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SESSIONS: '/sessions',
  CONVERSATIONS: '/conversations',
  SETTINGS: '/settings',
  USERS: '/users',
  AI_AGENTS: '/ai-agents',
  PROVIDERS: '/providers',
  SUPERADMIN_TENANTS: '/superadmin/tenants',
  SUPERADMIN_USERS: '/superadmin/users',
} as const;

export const QR_CODE_POLLING_INTERVAL = 3000; // 3 segundos
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SUPPORTED_AUDIO_TYPES = ['audio/ogg', 'audio/mpeg', 'audio/wav'];
export const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
