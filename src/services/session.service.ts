import { api, handleApiError } from './api';
import type {
  Session,
  InitializeSessionRequest,
  SessionStatusResponse,
  QRCodeResponse,
} from '@/types';

export const sessionService = {
  async initializeSession(request: InitializeSessionRequest): Promise<SessionStatusResponse> {
    try {
      const response = await api.post<SessionStatusResponse>('/Session/initialize', request);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getSessionStatus(phoneNumber: string): Promise<SessionStatusResponse> {
    try {
      const response = await api.get<SessionStatusResponse>('/Session/status', {
        params: { phoneNumber },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getAllSessions(): Promise<Session[]> {
    try {
      console.log('🔄 Fetching all sessions from /Session endpoint');
      const response = await api.get<SessionStatusResponse[]>('/Session');
      console.log('✅ Sessions API response:', response.data);
      const sessions = response.data.map((item) => sessionService.mapToSession(item));
      console.log('✅ Mapped sessions:', sessions);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      throw handleApiError(error);
    }
  },

  async disconnectSession(phoneNumber: string): Promise<void> {
    try {
      await api.delete('/Session/disconnect', {
        params: { phoneNumber },
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getQRCode(phoneNumber: string): Promise<string> {
    try {
      const response = await api.get<QRCodeResponse>('/Session/qrcode', {
        params: { phoneNumber },
      });
      return response.data.qrCode;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Helper to map API response to Session type
  mapToSession(response: SessionStatusResponse): Session {
    return {
      id: response.phoneNumber,
      phoneNumber: response.phoneNumber,
      provider: response.provider,
      isActive: response.isConnected,
      status: response.status,
      connectedAt: response.connectedAt ? new Date(response.connectedAt) : undefined,
      metadata: response.metadata,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  },
};
