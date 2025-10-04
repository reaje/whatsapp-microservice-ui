# Planejamento Frontend - WhatsApp Multi-Tenant System

## 📋 Visão Geral

Este documento apresenta o planejamento detalhado para implementação do frontend React que irá consumir a API .NET do WhatsApp Microservice.

**Idioma de Comunicação:** Português Brasileiro (pt-BR)

---

## 🎯 Objetivos do Frontend

- Interface web responsiva para gerenciamento de sessões WhatsApp
- Sistema de chat em tempo real com suporte a múltiplos tipos de mensagem
- Gerenciamento multi-tenant com isolamento de dados
- Integração com providers Baileys e Meta WhatsApp Business API
- Dashboard com métricas e analytics
- PWA para suporte mobile e offline

---

## 🏗️ Arquitetura Frontend

### Stack Tecnológico

```
- React 18 + TypeScript
- Vite (Build tool & Dev server)
- TailwindCSS + Shadcn/ui (UI Components)
- React Query (Data fetching & caching)
- Redux Toolkit (State management)
- React Router v6 (Routing)
- React Hook Form + Zod (Forms & Validation)
- Supabase JS Client (Realtime & Database)
- Socket.io Client (WebSocket fallback)
- Axios (HTTP client)
- Date-fns (Date utilities)
- Framer Motion (Animations)
- Recharts (Charts & Analytics)
```

### Estrutura de Pastas

```
frontend/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── assets/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── common/           # Componentes reutilizáveis
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Loading/
│   │   │   ├── ErrorBoundary/
│   │   │   └── Toast/
│   │   ├── layout/           # Layout components
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── MainLayout/
│   │   └── features/         # Feature-specific components
│   │       ├── auth/
│   │       ├── sessions/
│   │       ├── chat/
│   │       ├── dashboard/
│   │       └── settings/
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   ├── useMessage.ts
│   │   ├── useTenant.ts
│   │   └── useSupabase.ts
│   ├── services/             # API & External services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── session.service.ts
│   │   ├── message.service.ts
│   │   ├── tenant.service.ts
│   │   └── supabase.service.ts
│   ├── store/                # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── sessionSlice.ts
│   │   │   ├── chatSlice.ts
│   │   │   └── tenantSlice.ts
│   │   └── index.ts
│   ├── types/                # TypeScript types
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── session.types.ts
│   │   ├── message.types.ts
│   │   └── tenant.types.ts
│   ├── utils/                # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── pages/                # Page components
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Sessions/
│   │   ├── Conversations/
│   │   └── Settings/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── playwright.config.ts
```

---

## 🔌 Integração com Backend API

### Base URL

```
Development: http://localhost:5000/api/v1
Production: https://api.ventry.com.br/api/v1
```

### Autenticação

Todas as requisições devem incluir:

```http
X-Client-Id: {tenant-client-id}
Authorization: Bearer {jwt-token}
```

### Endpoints Disponíveis

#### **Sessions API**

```typescript
// POST /api/v1/session/initialize
interface InitializeSessionRequest {
  phoneNumber: string;
  providerType: 'baileys' | 'meta_api';
}

// GET /api/v1/session/status?phoneNumber={phone}
// GET /api/v1/session (lista todas as sessões)
// DELETE /api/v1/session/disconnect?phoneNumber={phone}
// GET /api/v1/session/qrcode?phoneNumber={phone}
```

#### **Messages API**

```typescript
// POST /api/v1/message/text
interface SendTextMessageRequest {
  to: string;
  content: string;
}

// POST /api/v1/message/media
interface SendMediaMessageRequest {
  to: string;
  mediaBase64: string;
  mediaType: 'image' | 'video' | 'document';
  caption?: string;
}

// POST /api/v1/message/audio
interface SendAudioMessageRequest {
  to: string;
  audioBase64: string;
}

// POST /api/v1/message/location
interface SendLocationMessageRequest {
  to: string;
  latitude: number;
  longitude: number;
}

// GET /api/v1/message/{messageId}/status
```

#### **Tenant API**

```typescript
// GET /api/v1/tenant/settings
// PUT /api/v1/tenant/settings
// POST /api/v1/tenant (criar tenant - admin only)
// GET /api/v1/tenant (listar todos - admin only)
```

#### **Webhooks API**

```typescript
// POST /api/v1/webhook/incoming-message (recebe mensagens)
// POST /api/v1/webhook/status-update (atualiza status)
// GET /api/v1/webhook/verify (verificação Meta API)
```

---

## 📱 Funcionalidades Principais

### 1. Autenticação e Multi-Tenancy

**Componentes:**

- `LoginPage` - Formulário de login com client-id
- `useAuth` hook - Gerenciamento de autenticação
- `TenantContext` - Context para dados do tenant

**Fluxo:**

1. Usuário insere email, senha e Client ID
2. Backend valida credenciais e retorna JWT
3. Frontend armazena token e client-id
4. Todas as requisições incluem headers de autenticação

**Arquivos:**

- `src/pages/Login/index.tsx`
- `src/hooks/useAuth.ts`
- `src/services/auth.service.ts`
- `src/store/slices/authSlice.ts`

---

### 2. Gerenciamento de Sessões WhatsApp

**Componentes:**

- `SessionsList` - Lista de sessões ativas/inativas
- `SessionCard` - Card individual de sessão
- `InitializeSessionModal` - Modal para criar nova sessão
- `QRCodeDisplay` - Exibição do QR Code (Baileys)
- `SessionStatusBadge` - Badge de status da sessão

**Funcionalidades:**

- Listar todas as sessões do tenant
- Inicializar nova sessão (Baileys ou Meta API)
- Visualizar status de conexão
- Exibir e atualizar QR Code automaticamente
- Desconectar sessão
- Indicadores visuais de status (conectado/desconectado/conectando)

**Fluxo de Inicialização (Baileys):**

1. Usuário clica "Nova Sessão"
2. Seleciona provider "Baileys"
3. Insere número de telefone
4. Backend gera QR Code
5. Frontend exibe QR Code e polling para status
6. Quando conectado, atualiza lista de sessões

**Arquivos:**

- `src/pages/Sessions/index.tsx`
- `src/components/features/sessions/SessionsList.tsx`
- `src/components/features/sessions/SessionCard.tsx`
- `src/components/features/sessions/InitializeSessionModal.tsx`
- `src/components/features/sessions/QRCodeDisplay.tsx`
- `src/hooks/useSession.ts`
- `src/services/session.service.ts`

---

### 3. Interface de Chat

**Componentes:**

- `ConversationsPage` - Página principal de conversas
- `ContactList` - Lista de contatos/conversas
- `ChatWindow` - Janela de chat principal
- `MessageBubble` - Bolha de mensagem individual
- `MessageInput` - Input de mensagem com opções
- `MediaPreview` - Preview de mídia antes de enviar
- `VoiceRecorder` - Gravador de áudio
- `EmojiPicker` - Seletor de emojis
- `AttachmentMenu` - Menu de anexos

**Funcionalidades:**

- Lista de conversas com últimas mensagens
- Busca de contatos
- Exibição de mensagens em tempo real
- Envio de texto
- Envio de imagens/vídeos/documentos (base64)
- Gravação e envio de áudio
- Envio de localização
- Preview de mídia
- Status de mensagem (enviando, enviado, entregue, lido)
- Indicador de digitação
- Scroll automático para nova mensagem
- Contador de mensagens não lidas

**Tipos de Mensagem Suportados:**

1. **Texto** - Mensagem de texto simples
2. **Mídia** - Imagens, vídeos, documentos (enviados como base64)
3. **Áudio** - Mensagens de voz (base64)
4. **Localização** - Coordenadas lat/lng

**Arquivos:**

- `src/pages/Conversations/index.tsx`
- `src/components/features/chat/ContactList.tsx`
- `src/components/features/chat/ChatWindow/index.tsx`
- `src/components/features/chat/MessageBubble.tsx`
- `src/components/features/chat/MessageInput.tsx`
- `src/components/features/chat/MediaPreview.tsx`
- `src/components/common/VoiceRecorder.tsx`
- `src/components/common/EmojiPicker.tsx`
- `src/hooks/useMessage.ts`
- `src/services/message.service.ts`

---

### 4. Dashboard e Métricas

**Componentes:**

- `DashboardPage` - Página principal do dashboard
- `MetricsCard` - Card de métrica individual
- `SessionsChart` - Gráfico de sessões ativas
- `MessagesChart` - Gráfico de mensagens enviadas/recebidas
- `RecentActivity` - Lista de atividades recentes

**Métricas Exibidas:**

- Total de sessões ativas
- Total de mensagens enviadas (hoje/semana/mês)
- Total de mensagens recebidas
- Taxa de entrega
- Sessões por provider (Baileys vs Meta API)
- Gráfico de mensagens ao longo do tempo
- Atividades recentes

**Arquivos:**

- `src/pages/Dashboard/index.tsx`
- `src/components/features/dashboard/MetricsCard.tsx`
- `src/components/features/dashboard/SessionsChart.tsx`
- `src/components/features/dashboard/MessagesChart.tsx`

---

### 5. Configurações

**Componentes:**

- `SettingsPage` - Página de configurações
- `TenantSettings` - Configurações do tenant
- `ProviderSettings` - Configurações de providers
- `WebhookSettings` - Configuração de webhooks
- `ApiKeysManager` - Gerenciamento de API keys

**Configurações Disponíveis:**

- Nome do tenant
- Provider padrão (Baileys/Meta API)
- Credenciais Meta API
- URLs de webhook
- Rate limits
- Configurações de notificações

**Arquivos:**

- `src/pages/Settings/index.tsx`
- `src/components/features/settings/TenantSettings.tsx`
- `src/components/features/settings/ProviderSettings.tsx`
- `src/components/features/settings/WebhookSettings.tsx`
- `src/hooks/useTenant.ts`
- `src/services/tenant.service.ts`

---

## 🔄 Integração Realtime com Supabase

### Configuração

```typescript
// src/services/supabase.service.ts
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Subscriptions

**1. Mensagens Recebidas**

```typescript
supabase
  .channel(`messages:${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // Atualizar UI com nova mensagem
  })
  .subscribe();
```

**2. Status de Mensagem**

```typescript
supabase
  .channel(`message_status:${messageId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages',
    filter: `message_id=eq.${messageId}`
  }, (payload) => {
    // Atualizar status na UI
  })
  .subscribe();
```

**3. Status de Sessão**

```typescript
supabase
  .channel(`sessions:${tenantId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'whatsapp_sessions',
    filter: `tenant_id=eq.${tenantId}`
  }, (payload) => {
    // Atualizar lista de sessões
  })
  .subscribe();
```

---

## 🎨 Design System

### Paleta de Cores

```css
:root {
  /* Primary - WhatsApp Green */
  --primary: #25D366;
  --primary-dark: #128C7E;
  --primary-light: #DCF8C6;

  /* Secondary */
  --secondary: #34B7F1;
  --secondary-dark: #075E54;

  /* Status Colors */
  --success: #4CAF50;
  --warning: #FF9800;
  --error: #F44336;
  --info: #2196F3;

  /* Neutrals */
  --gray-50: #FAFAFA;
  --gray-100: #F5F5F5;
  --gray-200: #EEEEEE;
  --gray-300: #E0E0E0;
  --gray-500: #9E9E9E;
  --gray-700: #616161;
  --gray-900: #212121;
}
```

### Componentes Base (Shadcn/ui)

- Button
- Input
- Select
- Modal/Dialog
- Tabs
- Toast
- Badge
- Card
- Avatar
- Dropdown Menu

---

## 🔐 Segurança

### Headers de Autenticação

```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const clientId = localStorage.getItem('client_id');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (clientId) {
    config.headers['X-Client-Id'] = clientId;
  }

  return config;
});
```

### Validação de Dados

- Todas as entradas de usuário validadas com Zod
- Sanitização de inputs
- Validação de tipos de arquivo
- Limite de tamanho de arquivos (10MB)

### Isolamento Multi-Tenant

- Client-ID obrigatório em todas as requisições
- Dados filtrados no backend por tenant
- Nenhum acesso cross-tenant
- Session storage separado por tenant

---

## 🧪 Testes

### Unit Tests (Vitest)

```bash
# Componentes individuais
src/components/**/*.test.tsx

# Hooks
src/hooks/**/*.test.ts

# Services
src/services/**/*.test.ts

# Utils
src/utils/**/*.test.ts
```

### Integration Tests

```bash
# Fluxos completos de features
src/__tests__/integration/
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/auth.spec.ts - Fluxo de autenticação
// tests/e2e/sessions.spec.ts - Gerenciamento de sessões
// tests/e2e/chat.spec.ts - Envio e recebimento de mensagens
// tests/e2e/dashboard.spec.ts - Visualização de métricas
```

---

## 📦 Build e Deploy

### Variáveis de Ambiente

```env
# .env.example
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
```

### Build de Produção

```bash
npm run build
# Output: dist/
```

### Docker

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Deploy

- **Opção 1:** Vercel (recomendado)
- **Opção 2:** Netlify
- **Opção 3:** AWS S3 + CloudFront
- **Opção 4:** Docker Container (Azure/AWS)

---

## 📊 Performance

### Otimizações

1. **Code Splitting** - Lazy loading de páginas
2. **Bundle Size** - Tree shaking e minificação
3. **Images** - Lazy loading e compressão
4. **Caching** - React Query cache (5 minutos)
5. **Memoization** - React.memo em componentes pesados

### PWA

- Service Worker para cache offline
- Manifest.json para instalação
- Cache de assets estáticos
- Cache de requisições API (estratégia NetworkFirst)

### Lighthouse Score Target

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

---

## 🔄 Fluxos Principais

### Fluxo 1: Inicializar Sessão Baileys

```
1. Usuário acessa página Sessions
2. Clica em "Nova Sessão"
3. Seleciona provider "Baileys"
4. Insere número de telefone
5. Frontend chama POST /api/v1/session/initialize
6. Backend retorna sessão criada
7. Frontend inicia polling GET /api/v1/session/qrcode
8. Exibe QR Code na tela
9. Continua polling até status = "connected"
10. Atualiza lista de sessões
11. Subscreve no Supabase para updates em tempo real
```

### Fluxo 2: Enviar Mensagem de Texto

```
1. Usuário seleciona contato na lista
2. Chat window abre com histórico de mensagens
3. Usuário digita mensagem no input
4. Pressiona Enter ou clica em Enviar
5. Frontend cria mensagem com status "sending"
6. Chama POST /api/v1/message/text
7. Backend processa e retorna messageId
8. Frontend atualiza status para "sent"
9. Webhook do provider atualiza status no Supabase
10. Realtime subscription atualiza UI (sent → delivered → read)
```

### Fluxo 3: Receber Mensagem

```
1. Provider envia mensagem para webhook do backend
2. Backend salva mensagem no Supabase
3. Supabase Realtime emite evento INSERT
4. Frontend subscription recebe evento
5. Frontend adiciona mensagem ao chat
6. Atualiza contador de não lidas
7. Exibe notificação (se janela inativa)
8. Auto-scroll para última mensagem (se janela ativa)
```

### Fluxo 4: Enviar Mídia (Imagem)

```
1. Usuário clica no botão de anexo
2. Seleciona imagem do dispositivo
3. Frontend converte para base64
4. Exibe preview da imagem
5. Usuário confirma envio
6. Frontend valida tamanho (< 10MB)
7. Chama POST /api/v1/message/media com base64
8. Backend processa e envia via provider
9. Retorna messageId e status
10. Frontend exibe mídia no chat
```

---

## 📅 Cronograma Sugerido

### Sprint 1 (Semana 1-2) - Fundação

- ✅ Configurar projeto Vite + React + TypeScript
- ✅ Estrutura de pastas e arquitetura
- ✅ Configurar TailwindCSS + Shadcn/ui
- ✅ Configurar React Router
- ✅ Implementar autenticação
- ✅ Configurar Redux Toolkit
- ✅ Criar services de API
- ✅ Implementar layout base (Header, Sidebar)

### Sprint 2 (Semana 3-4) - Sessões WhatsApp

- ✅ Página de Sessions
- ✅ Listar sessões
- ✅ Inicializar sessão (Baileys)
- ✅ Exibir QR Code
- ✅ Status de conexão
- ✅ Desconectar sessão
- ✅ Integração Supabase Realtime

### Sprint 3 (Semana 5-6) - Interface de Chat

- ✅ Página de Conversas
- ✅ Lista de contatos
- ✅ Chat window
- ✅ Envio de mensagem de texto
- ✅ Exibição de mensagens
- ✅ Status de mensagem
- ✅ Realtime de mensagens recebidas

### Sprint 4 (Semana 7-8) - Tipos de Mensagem

- ✅ Envio de imagens
- ✅ Envio de documentos
- ✅ Gravador de áudio
- ✅ Envio de áudio
- ✅ Envio de localização
- ✅ Preview de mídia

### Sprint 5 (Semana 9-10) - Dashboard e Settings

- ✅ Página de Dashboard
- ✅ Métricas e gráficos
- ✅ Página de Settings
- ✅ Configurações de tenant
- ✅ Configurações de providers

### Sprint 6 (Semana 11-12) - Testes e Deploy

- ✅ Testes unitários
- ✅ Testes de integração
- ✅ Testes E2E
- ✅ PWA configuration
- ✅ Otimizações de performance
- ✅ Build e deploy

---

## 📚 Dependências Principais

```json
{
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
    "axios": "^1.6.2",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.3",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "@playwright/test": "^1.40.1",
    "autoprefixer": "^10.4.16",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.4",
    "vitest": "^1.0.4"
  }
}
```

---

## 🚀 Próximos Passos

1. **Iniciar Sprint 1** - Configurar projeto base
2. **Definir design system** - Cores, tipografia, componentes
3. **Mockups de telas** - Wireframes das principais páginas
4. **Configurar CI/CD** - Pipeline de deploy automático
5. **Documentação de API** - Swagger/OpenAPI do backend

---

## 📞 Pontos de Atenção

⚠️ **Conversão Base64** - Imagens e áudios devem ser convertidos para base64 antes do envio

⚠️ **Rate Limiting** - Implementar throttling no envio de mensagens

⚠️ **Polling QR Code** - Implementar backoff exponencial para não sobrecarregar API

⚠️ **Tamanho de Arquivos** - Validar tamanho antes do upload (max 10MB)

⚠️ **Realtime Connections** - Gerenciar subscriptions para evitar memory leaks

⚠️ **Error Handling** - Tratamento robusto de erros de rede e API

⚠️ **Multi-Tenant Isolation** - Garantir que Client-ID está presente em todas as requisições

---

## ✅ Checklist de Implementação

### Configuração Inicial

- [ ] Criar projeto Vite com React + TypeScript
- [ ] Configurar TailwindCSS
- [ ] Instalar e configurar Shadcn/ui
- [ ] Configurar React Router
- [ ] Configurar Redux Toolkit
- [ ] Configurar React Query
- [ ] Criar arquivo .env.example
- [ ] Configurar ESLint + Prettier

### Serviços

- [ ] Implementar api.service.ts (Axios config)
- [ ] Implementar auth.service.ts
- [ ] Implementar session.service.ts
- [ ] Implementar message.service.ts
- [ ] Implementar tenant.service.ts
- [ ] Implementar supabase.service.ts

### Autenticação

- [ ] Criar LoginPage
- [ ] Implementar useAuth hook
- [ ] Implementar authSlice (Redux)
- [ ] Criar ProtectedRoute component
- [ ] Implementar refresh token logic

### Sessões WhatsApp

- [ ] Criar SessionsPage
- [ ] Implementar SessionsList component
- [ ] Implementar SessionCard component
- [ ] Implementar InitializeSessionModal
- [ ] Implementar QRCodeDisplay
- [ ] Implementar useSession hook
- [ ] Implementar polling de QR Code
- [ ] Implementar realtime de status

### Chat

- [ ] Criar ConversationsPage
- [ ] Implementar ContactList
- [ ] Implementar ChatWindow
- [ ] Implementar MessageBubble
- [ ] Implementar MessageInput
- [ ] Implementar MediaPreview
- [ ] Implementar VoiceRecorder
- [ ] Implementar EmojiPicker
- [ ] Implementar useMessage hook
- [ ] Implementar realtime de mensagens

### Dashboard

- [ ] Criar DashboardPage
- [ ] Implementar MetricsCard
- [ ] Implementar SessionsChart
- [ ] Implementar MessagesChart
- [ ] Buscar dados de métricas da API

### Settings

- [ ] Criar SettingsPage
- [ ] Implementar TenantSettings
- [ ] Implementar ProviderSettings
- [ ] Implementar WebhookSettings
- [ ] Implementar useTenant hook

### PWA

- [ ] Configurar manifest.json
- [ ] Implementar service worker
- [ ] Configurar vite-plugin-pwa
- [ ] Testar instalação PWA

### Testes

- [ ] Configurar Vitest
- [ ] Configurar Playwright
- [ ] Escrever testes unitários
- [ ] Escrever testes E2E
- [ ] Configurar coverage

### Deploy

- [ ] Criar Dockerfile
- [ ] Configurar nginx.conf
- [ ] Configurar variáveis de ambiente
- [ ] Testar build de produção
- [ ] Deploy em ambiente de staging

---

**Status:** 📋 Planejamento Completo
**Última Atualização:** 2025-01-10
**Responsável:** Equipe Frontend Ventry
