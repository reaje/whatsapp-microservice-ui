import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { aiAgentService } from '@/services/aiagent.service';
import type {
  AIAgentResponse,
  CreateAIAgentRequest,
  UpdateAIAgentRequest,
  CreateFromTemplateRequest,
  AIAgentTemplate,
} from '@/types/aiagent.types';

interface AIAgentState {
  agents: AIAgentResponse[];
  activeAgents: AIAgentResponse[];
  currentAgent: AIAgentResponse | null;
  templates: AIAgentTemplate[];
  loading: boolean;
  error: string | null;
}

const initialState: AIAgentState = {
  agents: [],
  activeAgents: [],
  currentAgent: null,
  templates: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchAgents = createAsyncThunk('aiAgent/fetchAgents', async () => {
  return await aiAgentService.getAll();
});

export const fetchActiveAgents = createAsyncThunk('aiAgent/fetchActiveAgents', async () => {
  return await aiAgentService.getActive();
});

export const fetchAgentById = createAsyncThunk(
  'aiAgent/fetchAgentById',
  async (agentId: string) => {
    return await aiAgentService.getById(agentId);
  }
);

export const createAgent = createAsyncThunk(
  'aiAgent/createAgent',
  async (data: CreateAIAgentRequest) => {
    return await aiAgentService.create(data);
  }
);

export const updateAgent = createAsyncThunk(
  'aiAgent/updateAgent',
  async ({ agentId, data }: { agentId: string; data: UpdateAIAgentRequest }) => {
    return await aiAgentService.update(agentId, data);
  }
);

export const deleteAgent = createAsyncThunk('aiAgent/deleteAgent', async (agentId: string) => {
  await aiAgentService.delete(agentId);
  return agentId;
});

export const toggleAgent = createAsyncThunk('aiAgent/toggleAgent', async (agentId: string) => {
  await aiAgentService.toggle(agentId);
  return agentId;
});

export const fetchTemplates = createAsyncThunk('aiAgent/fetchTemplates', async () => {
  return await aiAgentService.getTemplates();
});

export const createFromTemplate = createAsyncThunk(
  'aiAgent/createFromTemplate',
  async ({ templateId, data }: { templateId: string; data: CreateFromTemplateRequest }) => {
    return await aiAgentService.createFromTemplate(templateId, data);
  }
);

export const aiAgentSlice = createSlice({
  name: 'aiAgent',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAgent: (state) => {
      state.currentAgent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all agents
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action: PayloadAction<AIAgentResponse[]>) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar agentes';
      })
      // Fetch active agents
      .addCase(fetchActiveAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchActiveAgents.fulfilled,
        (state, action: PayloadAction<AIAgentResponse[]>) => {
          state.loading = false;
          state.activeAgents = action.payload;
        }
      )
      .addCase(fetchActiveAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar agentes ativos';
      })
      // Fetch agent by ID
      .addCase(fetchAgentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgentById.fulfilled, (state, action: PayloadAction<AIAgentResponse>) => {
        state.loading = false;
        state.currentAgent = action.payload;
      })
      .addCase(fetchAgentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar agente';
      })
      // Create agent
      .addCase(createAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action: PayloadAction<AIAgentResponse>) => {
        state.loading = false;
        state.agents.push(action.payload);
        if (action.payload.isActive) {
          state.activeAgents.push(action.payload);
        }
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao criar agente';
      })
      // Update agent
      .addCase(updateAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAgent.fulfilled, (state, action: PayloadAction<AIAgentResponse>) => {
        state.loading = false;
        const index = state.agents.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
        const activeIndex = state.activeAgents.findIndex((a) => a.id === action.payload.id);
        if (action.payload.isActive && activeIndex === -1) {
          state.activeAgents.push(action.payload);
        } else if (!action.payload.isActive && activeIndex !== -1) {
          state.activeAgents.splice(activeIndex, 1);
        } else if (activeIndex !== -1) {
          state.activeAgents[activeIndex] = action.payload;
        }
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao atualizar agente';
      })
      // Delete agent
      .addCase(deleteAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAgent.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.agents = state.agents.filter((a) => a.id !== action.payload);
        state.activeAgents = state.activeAgents.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao deletar agente';
      })
      // Toggle agent
      .addCase(toggleAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleAgent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(toggleAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao alternar agente';
      })
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action: PayloadAction<AIAgentTemplate[]>) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar templates';
      })
      // Create from template
      .addCase(createFromTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFromTemplate.fulfilled, (state, action: PayloadAction<AIAgentResponse>) => {
        state.loading = false;
        state.agents.push(action.payload);
        if (action.payload.isActive) {
          state.activeAgents.push(action.payload);
        }
      })
      .addCase(createFromTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao criar agente a partir do template';
      });
  },
});

export const { clearError, clearCurrentAgent } = aiAgentSlice.actions;
export default aiAgentSlice.reducer;
