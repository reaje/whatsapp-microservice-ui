export interface AIAgentResponse {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  configuration: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAIAgentRequest {
  name: string;
  type?: string | null;
  configuration?: string | null;
}

export interface UpdateAIAgentRequest {
  name?: string | null;
  type?: string | null;
  configuration?: string | null;
  isActive?: boolean | null;
}

export interface CreateFromTemplateRequest {
  name?: string | null;
}

export interface AIAgentTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  defaultConfiguration: string;
}

export interface AIAgentConfiguration {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: string;
  tools?: string[];
  [key: string]: unknown;
}
