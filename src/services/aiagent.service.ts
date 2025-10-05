import { api } from './api';
import type {
  AIAgentResponse,
  CreateAIAgentRequest,
  UpdateAIAgentRequest,
  CreateFromTemplateRequest,
  AIAgentTemplate,
} from '@/types/aiagent.types';

export const aiAgentService = {
  async getAll(): Promise<AIAgentResponse[]> {
    const response = await api.get<AIAgentResponse[]>('/AIAgent');
    return response.data;
  },

  async getActive(): Promise<AIAgentResponse[]> {
    const response = await api.get<AIAgentResponse[]>('/AIAgent/active');
    return response.data;
  },

  async getById(agentId: string): Promise<AIAgentResponse> {
    const response = await api.get<AIAgentResponse>(`/AIAgent/${agentId}`);
    return response.data;
  },

  async create(data: CreateAIAgentRequest): Promise<AIAgentResponse> {
    const response = await api.post<AIAgentResponse>('/AIAgent', data);
    return response.data;
  },

  async update(agentId: string, data: UpdateAIAgentRequest): Promise<AIAgentResponse> {
    const response = await api.put<AIAgentResponse>(`/AIAgent/${agentId}`, data);
    return response.data;
  },

  async delete(agentId: string): Promise<void> {
    await api.delete(`/AIAgent/${agentId}`);
  },

  async toggle(agentId: string): Promise<void> {
    await api.post(`/AIAgent/${agentId}/toggle`);
  },

  async getTemplates(): Promise<AIAgentTemplate[]> {
    const response = await api.get<AIAgentTemplate[]>('/AIAgent/templates');
    return response.data;
  },

  async createFromTemplate(
    templateId: string,
    data: CreateFromTemplateRequest
  ): Promise<AIAgentResponse> {
    const response = await api.post<AIAgentResponse>(
      `/AIAgent/templates/${templateId}/create`,
      data
    );
    return response.data;
  },

  // Aciona IA manualmente para responder agora o contato (última mensagem entrante)
  async replyNow(params: { phoneNumber: string; text?: string }): Promise<{ messageId?: string }> {
    const response = await api.post(`/Message/ai/reply-now`, {
      phoneNumber: params.phoneNumber,
      text: params.text,
    });
    return response.data;
  },
};
