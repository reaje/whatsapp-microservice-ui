# Guia de Implementação - Frontend React

## Communication Language

**Portuguese (Brazilian)** - Toda a comunicação deve ser no idioma Portuguese Brazilian (pt-BR).

## 1. Estrutura de Pastas do Projeto React

```
whatsapp-frontend/
├── public/
│   ├── manifest.json
│   └── service-worker.js
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Loading/
│   │   │   └── ErrorBoundary/
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── MainLayout/
│   │   └── features/
│   │       ├── chat/
│   │       │   ├── ChatList/
│   │       │   ├── ChatWindow/
│   │       │   ├── MessageInput/
│   │       │   └── MessageBubble/
│   │       ├── agents/
│   │       │   ├── AgentList/
│   │       │   ├── AgentConfig/
│   │       │   └── AgentMetrics/
│   │       └── settings/
│   │           ├── ProviderSettings/
│   │           └── TenantSettings/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWhatsApp.ts
│   │   ├── useSupabase.ts
│   │   └── useTenant.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── whatsapp.service.ts
│   │   ├── agent.service.ts
│   │   └── supabase.service.ts
│   │
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── chatSlice.ts
│   │   │   ├── agentSlice.ts
│   │   │   └── tenantSlice.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── message.types.ts
│   │   ├── agent.types.ts
│   │   └── tenant.types.ts
│   │
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Conversations/
│   │   ├── Agents/
│   │   └── Settings/
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 2. Configuração Inicial

### 2.1 Package.json

```json
{
  "name": "whatsapp-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4",
    "@tanstack/react-query": "^5.13.4",
    "@supabase/supabase-js": "^2.39.0",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "socket.io-client": "^4.5.4",
    "axios": "^1.6.2",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^10.16.16",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.3",
    "react-audio-recorder": "^3.0.0",
    "react-dropzone": "^14.2.3",
    "emoji-picker-react": "^4.5.16",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@playwright/test": "^1.40.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.4",
    "vitest": "^1.0.4"
  }
}
```

### 2.2 Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WEBSOCKET_URL=ws://localhost:5001
```

## 3. Componentes Principais

### 3.1 Hook de Autenticação

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '@/services/auth.service';
import { setUser, logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, tenant } = useSelector(
    (state: RootState) => state.auth
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await authService.validateToken(token);
          dispatch(setUser(userData));
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [dispatch]);

  const login = async (email: string, password: string, clientId: string) => {
    const response = await authService.login(email, password, clientId);
    dispatch(setUser(response));
    return response;
  };

  const logoutUser = () => {
    authService.logout();
    dispatch(logout());
  };

  return {
    user,
    tenant,
    isAuthenticated,
    loading,
    login,
    logout: logoutUser,
  };
};
```

### 3.2 Hook do WhatsApp

```typescript
// src/hooks/useWhatsApp.ts
import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { whatsappService } from '@/services/whatsapp.service';
import { Message, Session } from '@/types';
import toast from 'react-hot-toast';

export const useWhatsApp = (sessionId?: string) => {
  const queryClient = useQueryClient();
  const { subscribeToMessages, unsubscribe } = useSupabase();

  // Fetch sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: whatsappService.getSessions,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => whatsappService.getMessages(sessionId!),
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: whatsappService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Mensagem enviada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (sessionId) {
      const subscription = subscribeToMessages(sessionId, (message) => {
        queryClient.setQueryData(['messages', sessionId], (old: Message[]) => {
          return [...(old || []), message];
        });
      });

      return () => unsubscribe(subscription);
    }
  }, [sessionId, subscribeToMessages, unsubscribe, queryClient]);

  // Initialize session
  const initializeSession = useCallback(
    async (phoneNumber: string, provider: 'baileys' | 'meta_api') => {
      try {
        const session = await whatsappService.initializeSession(
          phoneNumber,
          provider
        );
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        return session;
      } catch (error) {
        toast.error('Erro ao inicializar sessão');
        throw error;
      }
    },
    [queryClient]
  );

  return {
    sessions,
    messages,
    sessionsLoading,
    messagesLoading,
    sendMessage,
    initializeSession,
  };
};
```

### 3.3 Componente de Chat

```typescript
// src/components/features/chat/ChatWindow/ChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Paperclip, Mic, Image, MapPin } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import MessageBubble from '../MessageBubble';
import MessageInput from '../MessageInput';
import VoiceRecorder from '@/components/common/VoiceRecorder';
import FileUpload from '@/components/common/FileUpload';
import { Message } from '@/types';

const messageSchema = z.object({
  content: z.string().min(1, 'Digite uma mensagem'),
  type: z.enum(['text', 'image', 'audio', 'document', 'location']),
});

interface ChatWindowProps {
  sessionId: string;
  contact: {
    id: string;
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
}

const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId, contact }) => {
  const { messages, sendMessage, messagesLoading } = useWhatsApp(sessionId);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { register, handleSubmit, reset, setValue } = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      type: 'text' as const,
      content: '',
    },
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    await sendMessage.mutateAsync({
      sessionId,
      to: contact.phoneNumber,
      ...data,
    });
    reset();
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('to', contact.phoneNumber);

    await sendMessage.mutateAsync({
      sessionId,
      to: contact.phoneNumber,
      type: 'document',
      content: formData,
    });
    setAttachmentMenu(false);
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('sessionId', sessionId);
    formData.append('to', contact.phoneNumber);

    await sendMessage.mutateAsync({
      sessionId,
      to: contact.phoneNumber,
      type: 'audio',
      content: formData,
    });
    setIsRecording(false);
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          {contact.avatar ? (
            <img 
              src={contact.avatar} 
              alt={contact.name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold">
              {contact.name[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{contact.name}</h3>
          <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message: Message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.fromNumber === sessionId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border-t p-4"
      >
        <div className="flex items-center gap-2">
          {/* Attachment Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAttachmentMenu(!attachmentMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            
            {attachmentMenu && (
              <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg p-2 min-w-[200px]">
                <FileUpload onUpload={handleFileUpload}>
                  <button className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded">
                    <Image className="w-4 h-4" />
                    <span>Imagem</span>
                  </button>
                </FileUpload>
                <button className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded">
                  <MapPin className="w-4 h-4" />
                  <span>Localização</span>
                </button>
              </div>
            )}
          </div>

          {/* Message Input */}
          <input
            {...register('content')}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          />

          {/* Voice or Send Button */}
          {isRecording ? (
            <VoiceRecorder
              onStop={handleVoiceMessage}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Mic className="w-5 h-5 text-gray-600" />
              </button>
              <button
                type="submit"
                className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark"
              >
                <Send className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
```

### 3.4 Serviço do Supabase

```typescript
// src/services/supabase.service.ts
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Message, Session } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {
  private channels: Map<string, RealtimeChannel> = new Map();

  async subscribeToMessages(
    sessionId: string,
    callback: (message: Message) => void
  ) {
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    this.channels.set(sessionId, channel);
    return channel;
  }

  async unsubscribe(channel: RealtimeChannel) {
    await channel.unsubscribe();
    
    // Remove from map
    for (const [key, value] of this.channels.entries()) {
      if (value === channel) {
        this.channels.delete(key);
        break;
      }
    }
  }

  async unsubscribeAll() {
    for (const channel of this.channels.values()) {
      await channel.unsubscribe();
    }
    this.channels.clear();
  }

  // Database queries
  async getMessages(sessionId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.reverse() || [];
  }

  async getSessions(tenantId: string) {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async updateMessageStatus(messageId: string, status: string) {
    const { error } = await supabase
      .from('messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  }

  // Webhook handling
  async registerWebhook(url: string, events: string[]) {
    // This would typically be done through Supabase dashboard
    // or via their management API
    console.log('Webhook registered:', { url, events });
  }
}

export const supabaseService = new SupabaseService();
```

### 3.5 Store Redux

```typescript
// src/store/slices/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, Session } from '@/types';

interface ChatState {
  activeSession: Session | null;
  sessions: Session[];
  messages: Record<string, Message[]>;
  typing: Record<string, boolean>;
  unreadCounts: Record<string, number>;
}

const initialState: ChatState = {
  activeSession: null,
  sessions: [],
  messages: {},
  typing: {},
  unreadCounts: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<Session>) => {
      state.activeSession = action.payload;
      // Clear unread count for this session
      if (action.payload.id) {
        state.unreadCounts[action.payload.id] = 0;
      }
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ sessionId: string; message: Message }>) => {
      const { sessionId, message } = action.payload;
      if (!state.messages[sessionId]) {
        state.messages[sessionId] = [];
      }
      state.messages[sessionId].push(message);
      
      // Increment unread if not active session
      if (state.activeSession?.id !== sessionId && !message.isOwn) {
        state.unreadCounts[sessionId] = (state.unreadCounts[sessionId] || 0) + 1;
      }
    },
    setMessages: (state, action: PayloadAction<{ sessionId: string; messages: Message[] }>) => {
      const { sessionId, messages } = action.payload;
      state.messages[sessionId] = messages;
    },
    setTyping: (state, action: PayloadAction<{ sessionId: string; isTyping: boolean }>) => {
      const { sessionId, isTyping } = action.payload;
      state.typing[sessionId] = isTyping;
    },
    clearChat: (state) => {
      state.messages = {};
      state.typing = {};
      state.unreadCounts = {};
    },
  },
});

export const { 
  setActiveSession, 
  setSessions, 
  addMessage, 
  setMessages, 
  setTyping,
  clearChat 
} = chatSlice.actions;

export default chatSlice.reducer;
```

## 4. Integração com AI Agents

### 4.1 Componente de Configuração de Agente

```typescript
// src/components/features/agents/AgentConfig/AgentConfig.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Save, TestTube } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import Select from '@/components/common/Select';
import Textarea from '@/components/common/Textarea';
import Button from '@/components/common/Button';

const agentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['real_estate', 'customer_support', 'sales', 'custom']),
  systemPrompt: z.string().min(10, 'Prompt deve ter pelo menos 10 caracteres'),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(50).max(4000),
  knowledgeBase: z.string().optional(),
  capabilities: z.array(z.string()),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentConfigProps {
  agentId?: string;
  onSave?: () => void;
}

const AgentConfig: React.FC<AgentConfigProps> = ({ agentId, onSave }) => {
  const { createAgent, updateAgent, testAgent } = useAgents();
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      type: 'customer_support',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 500,
      capabilities: [],
    },
  });

  const onSubmit = async (data: AgentFormData) => {
    try {
      if (agentId) {
        await updateAgent.mutateAsync({ id: agentId, ...data });
      } else {
        await createAgent.mutateAsync(data);
      }
      onSave?.();
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };

  const handleTest = async () => {
    const testMessage = "Olá, preciso de ajuda!";
    const response = await testAgent.mutateAsync({ 
      agentId: agentId || 'temp',
      message: testMessage 
    });
    console.log('Test response:', response);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Configuração do Agente IA</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Agente
                </label>
                <input
                  {...field}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Assistente Imobiliário"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Agente
                </label>
                <Select {...field}>
                  <option value="real_estate">Imobiliário</option>
                  <option value="customer_support">Suporte ao Cliente</option>
                  <option value="sales">Vendas</option>
                  <option value="custom">Personalizado</option>
                </Select>
              </div>
            )}
          />
        </div>

        <Controller
          name="systemPrompt"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-2">
                System Prompt
              </label>
              <Textarea
                {...field}
                rows={6}
                placeholder="Você é um assistente especializado em..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
              {errors.systemPrompt && (
                <p className="text-red-500 text-sm mt-1">{errors.systemPrompt.message}</p>
              )}
            </div>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="temperature"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature ({field.value})
                </label>
                <input
                  {...field}
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Preciso</span>
                  <span>Criativo</span>
                </div>
              </div>
            )}
          />

          <Controller
            name="maxTokens"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tokens
                </label>
                <input
                  {...field}
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </div>
            )}
          />
        </div>

        <Controller
          name="capabilities"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-2">
                Capacidades
              </label>
              <div className="space-y-2">
                {[
                  'search_properties',
                  'schedule_visits',
                  'provide_documentation',
                  'calculate_financing',
                  'answer_questions',
                ].map((capability) => (
                  <label key={capability} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={capability}
                      checked={field.value.includes(capability)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, capability]);
                        } else {
                          field.onChange(
                            field.value.filter((c) => c !== capability)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      {capability.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTest}
            disabled={isSubmitting}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Testar Agente
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {agentId ? 'Atualizar' : 'Criar'} Agente
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgentConfig;
```

## 5. PWA Configuration

### 5.1 Vite Config com PWA

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'WhatsApp Multi-Tenant',
        short_name: 'WhatsApp MT',
        description: 'Sistema de comunicação WhatsApp com IA',
        theme_color: '#25D366',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5001',
        ws: true,
      },
    },
  },
});
```

## 6. Testes E2E

### 6.1 Playwright Test

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="clientId"]', 'tenant-123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard');
  });

  test('should send a text message', async ({ page }) => {
    // Navigate to conversations
    await page.click('text=Conversas');
    
    // Select a contact
    await page.click('.contact-list-item:first-child');
    
    // Type message
    const messageInput = page.locator('[placeholder="Digite uma mensagem..."]');
    await messageInput.fill('Hello, this is a test message');
    
    // Send message
    await page.click('button[aria-label="Send"]');
    
    // Verify message appears
    await expect(page.locator('.message-bubble').last()).toContainText(
      'Hello, this is a test message'
    );
  });

  test('should upload and send an image', async ({ page }) => {
    await page.click('text=Conversas');
    await page.click('.contact-list-item:first-child');
    
    // Open attachment menu
    await page.click('button[aria-label="Attachments"]');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Verify image preview
    await expect(page.locator('.image-preview')).toBeVisible();
    
    // Send
    await page.click('button[aria-label="Send Image"]');
    
    // Verify sent
    await expect(page.locator('.message-image').last()).toBeVisible();
  });

  test('should interact with AI agent', async ({ page }) => {
    // Navigate to AI Agents
    await page.click('text=Agentes IA');
    
    // Create new agent
    await page.click('button:has-text("Novo Agente")');
    
    // Fill agent form
    await page.fill('[name="name"]', 'Test Agent');
    await page.selectOption('[name="type"]', 'customer_support');
    await page.fill(
      '[name="systemPrompt"]',
      'You are a helpful customer support agent'
    );
    
    // Save agent
    await page.click('button:has-text("Criar Agente")');
    
    // Verify agent created
    await expect(page.locator('text=Test Agent')).toBeVisible();
    
    // Test agent
    await page.click('button:has-text("Testar")');
    await expect(page.locator('.test-response')).toBeVisible();
  });
});
```

## 7. Deployment Configuration

### 7.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 7.2 Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api {
        proxy_pass http://whatsapp-api:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://whatsapp-api:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 8. Monitoramento e Analytics

### 8.1 Integração com Analytics

```typescript
// src/utils/analytics.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
      });
    }

    // Custom event tracking
    trackEvent('page_view', {
      page_location: location.pathname,
      page_title: document.title,
    });
  }, [location]);
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }

  // Also send to internal analytics
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: eventName,
      parameters,
      timestamp: new Date().toISOString(),
    }),
  });
};

// Error tracking
export const trackError = (error: Error, errorInfo?: any) => {
  console.error('Application Error:', error, errorInfo);
  
  // Send to error tracking service
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      extra: errorInfo,
    });
  }

  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    ...errorInfo,
  });
};
```

## 9. Performance Optimization

### 9.1 Lazy Loading e Code Splitting

```typescript
// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoadingScreen from '@/components/common/LoadingScreen';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Conversations = lazy(() => import('@/pages/Conversations'));
const Agents = lazy(() => import('@/pages/Agents'));
const Settings = lazy(() => import('@/pages/Settings'));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

## 10. Conclusão

Este guia fornece uma base sólida para implementar o frontend React do sistema WhatsApp Multi-Tenant. As principais características incluem:

- ✅ Arquitetura modular e escalável
- ✅ Integração completa com Supabase
- ✅ Sistema de chat em tempo real
- ✅ Gestão de agentes IA
- ✅ Multi-tenancy com isolamento
- ✅ PWA com suporte offline
- ✅ Testes E2E abrangentes
- ✅ Performance otimizada
- ✅ Deploy containerizado

### Próximos Passos

1. Implementar autenticação OAuth
2. Adicionar suporte a vídeo chamadas
3. Implementar sistema de templates de mensagens
4. Adicionar dashboard analytics avançado
5. Implementar sistema de notificações push
