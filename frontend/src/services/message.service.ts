import { api, handleApiError } from './api';
import type {
  SendTextMessageRequest,
  SendMediaMessageRequest,
  SendAudioMessageRequest,
  SendLocationMessageRequest,
  MessageResponse,
} from '@/types';

export const messageService = {
  async sendText(request: SendTextMessageRequest): Promise<MessageResponse> {
    try {
      const response = await api.post<MessageResponse>('/message/text', request);
      return this.mapMessageResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async sendMedia(request: SendMediaMessageRequest): Promise<MessageResponse> {
    try {
      const response = await api.post<MessageResponse>('/message/media', request);
      return this.mapMessageResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async sendAudio(request: SendAudioMessageRequest): Promise<MessageResponse> {
    try {
      const response = await api.post<MessageResponse>('/message/audio', request);
      return this.mapMessageResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async sendLocation(request: SendLocationMessageRequest): Promise<MessageResponse> {
    try {
      const response = await api.post<MessageResponse>('/message/location', request);
      return this.mapMessageResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getMessageStatus(messageId: string): Promise<MessageResponse> {
    try {
      const response = await api.get<MessageResponse>(`/message/${messageId}/status`);
      return this.mapMessageResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getMessageHistory(phoneNumber: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/message/history/${phoneNumber}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getConversations(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/message/conversations');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Helper to ensure dates are in ISO format
  mapMessageResponse(response: MessageResponse): MessageResponse {
    return {
      ...response,
      timestamp: typeof response.timestamp === 'string'
        ? response.timestamp
        : new Date(response.timestamp).toISOString(),
    };
  },
};
