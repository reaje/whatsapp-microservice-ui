# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Communication Language:** Portuguese Brazilian (pt-BR) - All UI strings, comments, and documentation should be in Brazilian Portuguese.

## Project Overview

**WhatsApp Multi-Tenant Microservice** - Enterprise-grade WhatsApp messaging platform with multi-tenancy support. The system integrates both Baileys (WhatsApp Web protocol) and Meta WhatsApp Business API through a provider abstraction layer.

**Status Atual:** ✅ Fase 1 - MVP 100% COMPLETA (incluindo testes unitários)

**Architecture:** Monorepo with three services:
- `.NET 9 Backend API` (C#) - Multi-tenant orchestration, business logic, data persistence
- `React Frontend` (TypeScript + Vite) - Web-based administration and chat interface
- `Baileys Service` (Node.js/TypeScript + Express) - WhatsApp Web protocol handler

**Features Implementadas:**
- ✅ Autenticação JWT com multi-tenancy
- ✅ Gestão de sessões WhatsApp (Baileys provider)
- ✅ Envio de mensagens (texto, mídia, áudio, localização)
- ✅ Sistema de webhooks para eventos
- ✅ CRUD de usuários com controle de roles (Admin/User)
- ✅ Interface web completa com chat em tempo real
- ✅ Health checks e monitoramento
- ✅ Migrations automáticas no startup
- ✅ **54 testes unitários passando (AuthService, MessageService, TenantService, UserService, TenantMiddleware)**
- ✅ **Coverage report gerado em HTML**

## Running the Full Stack

### Development (All Services)

Backend API (port 5000):
```bash
cd backend/src/WhatsApp.API
dotnet run --urls "http://localhost:5000"
```

Baileys Service (port 3000):
```bash
cd baileys-service
npm install
npm run dev
```

Frontend (port 3000):
```bash
cd frontend
npm install
npm run dev
```

### Production (Docker Compose)

```bash
docker-compose up --build
```

Services run on:
- Nginx (reverse proxy): http://localhost:80
- Backend API: http://localhost:5000
- Baileys Service: http://localhost:3000

## Multi-Tenancy Architecture

### Request Flow

All authenticated requests require two headers:
- `X-Client-Id: <tenant-client-id>` - Tenant identifier
- `Authorization: Bearer <jwt-token>` - User authentication

### Tenant Isolation Enforcement

1. **Frontend** (`src/services/api.ts`): Axios interceptor injects both headers automatically
2. **Backend** (`TenantMiddleware.cs`): Validates `X-Client-Id` header, loads tenant from database, stores in `HttpContext.Items["Tenant"]`
3. **Controllers**: Extract `TenantId` from HttpContext for all database queries
4. **Database**: All tables include `tenant_id` column with foreign key to `tenants` table

Bypass tenant validation for:
- `/health`, `/openapi`, `/scalar` endpoints
- `/api/v1/auth/*` (authentication endpoints)
- `POST /api/v1/tenant` (tenant creation)

## Database Management

### Auto-Migration on Startup

The backend **automatically applies EF Core migrations** on startup (`Program.cs:121-143`). No manual migration needed when deploying.

Database seeding also occurs on startup, creating:
- Test tenant: `client_id = "test-client-001"`
- Admin user: `admin@test.com` / `Admin@123`
- Regular user: `user@test.com` / `User@123`

### Manual Migration Commands

```bash
cd backend/src/WhatsApp.Infrastructure

# Create new migration
dotnet ef migrations add MigrationName --startup-project ../WhatsApp.API

# Revert last migration
dotnet ef migrations remove --startup-project ../WhatsApp.API

# View migration SQL
dotnet ef migrations script --startup-project ../WhatsApp.API
```

### Database Schema

PostgreSQL via Supabase with schema `whatsapp_service`:
- `tenants` - Multi-tenant isolation root
- `users` - Per-tenant users with role-based access (Admin/User)
- `whatsapp_sessions` - Active WhatsApp connections (phone numbers, session data)
- `messages` - Message history with JSONB content
- `ai_agents` - AI automation configurations
- `ai_conversations` - AI conversation contexts

## Authentication & Authorization

### JWT Token Flow

1. **Login**: POST `/api/v1/auth/login` with `{ email, password, clientId }`
   - Returns: `{ token, user, clientId }`
   - Token contains claims: `sub` (user ID), `email`, `role`, `client_id`, `tenant_id`

2. **Token Validation**: `Program.cs:76-99` configures JWT validation
   - Issuer: `whatsapp-microservice`
   - Audience: `whatsapp-frontend`
   - Signing key from `appsettings.json:Jwt:Key`

3. **Role-Based Authorization**:
   - Admin-only endpoints: `[Authorize(Roles = "Admin")]`
   - User management: Admin only
   - Session/message operations: All authenticated users

### Extracting Claims in Controllers

```csharp
var tenantId = HttpContext.GetTenantId();  // From X-Client-Id header
var userId = HttpContext.GetUserId();      // From JWT sub claim
var role = HttpContext.GetUserRole();      // From JWT role claim
```

Extension methods in `HttpContextExtensions.cs`.

## Backend Architecture

### Clean Architecture Layers

```
WhatsApp.Core/              # Domain layer (entities, interfaces, enums)
├── Entities/               # Database models (Tenant, User, Message, etc.)
├── Interfaces/             # Service contracts (IMessageService, ISessionService)
├── Enums/                  # Message types, statuses, provider types
└── Models/                 # Domain DTOs

WhatsApp.Infrastructure/    # Data access & external integrations
├── Data/                   # EF Core DbContext, repositories
├── Services/               # Business logic implementations
├── Providers/              # WhatsApp provider abstraction (Baileys, Meta API)
├── Migrations/             # EF Core migrations
└── Extensions/             # DI registration

WhatsApp.API/               # Presentation layer
├── Controllers/            # REST endpoints
├── DTOs/                   # Request/response models
├── Middleware/             # Tenant validation, error handling
└── Extensions/             # HttpContext helpers
```

### Provider Pattern

`IWhatsAppProvider` abstraction allows switching between:
- `BaileysProvider` - WhatsApp Web via Node.js service (default)
- `MetaApiProvider` - Official Meta Business API (future)

Provider selection: Per-session via `ProviderType` enum in `whatsapp_sessions.provider_type`.

### Dependency Injection

All services registered in `ServiceCollectionExtensions.cs`:
- Repositories: Scoped (per-request)
- Services: Scoped (per-request)
- HttpClient for Baileys: Named client "BaileysService"
- Supabase Client: Scoped with auto-connect realtime

## Frontend Architecture

See `frontend/CLAUDE.md` for detailed frontend guidance.

**Key Points:**
- Redux Toolkit for global state (auth, sessions, chat, tenant, users)
- React Query for server-side caching
- Automatic `X-Client-Id` and `Authorization` header injection
- Protected routes with authentication checks
- Lazy-loaded pages via React.lazy()

## Baileys Service Integration

The .NET backend communicates with the Baileys Node.js service via HTTP:

### Backend → Baileys Communication

`BaileysProvider.cs` makes HTTP calls to Baileys service:
- `POST /session/initialize` - Start new WhatsApp session, get QR code
- `GET /session/status?phone={number}` - Check session connection state
- `POST /session/disconnect` - Terminate WhatsApp session
- `POST /message/text` - Send text message
- `POST /message/media` - Send image/video/document

### Baileys Service Endpoints

Located in `baileys-service/src/routes/`:
- `session.routes.ts` - Session lifecycle management
- `message.routes.ts` - Message sending operations

Session data persisted in-memory by `SessionManager.ts` (stores Baileys auth state).

### Health Check

The backend includes a health check for Baileys service:
- `BaileysServiceHealthCheck.cs` - Pings Baileys `/health` endpoint
- Registered in `Program.cs:70-74`
- Available at `/health` (includes DB + Baileys status)

## Testing Strategy

### Backend Tests

```bash
cd backend

# Run all tests
dotnet test

# Run specific categories
dotnet test --filter Category=Unit
dotnet test --filter Category=Integration
dotnet test --filter Category=E2E

# With coverage
dotnet test /p:CollectCoverage=true
```

Test types:
- **Unit**: Service logic, validators (`WhatsApp.Tests/Unit/`)
- **Integration**: Database operations, repository patterns (`WhatsApp.Tests/Integration/`)
- **E2E**: Full request flow with Baileys service (`WhatsApp.Tests/E2E/`)

### Frontend Tests

```bash
cd frontend

npm run test              # Vitest unit tests
npm run test:e2e          # Playwright E2E tests
npm run test:coverage     # Coverage report
```

## Environment Configuration

### Backend (`backend/src/WhatsApp.API/appsettings.json`)

Required:
- `ConnectionStrings:RulesEngineDatabase` - PostgreSQL connection string
- `Jwt:Key` - Secret key for JWT signing (min 32 chars)
- `Jwt:Issuer` - Token issuer (default: "whatsapp-microservice")
- `Jwt:Audience` - Token audience (default: "whatsapp-frontend")

Optional:
- `BaileysService:Url` - Baileys service URL (default: "http://localhost:3000")
- `BaileysService:AutoStart` - Auto-start Baileys on startup (default: true)
- `Supabase:Url` - Supabase project URL for realtime features
- `Supabase:AnonKey` - Supabase anonymous key

### Frontend (`frontend/.env`)

Required:
- `VITE_API_URL` - Backend API base URL (default: "http://localhost:5000/api/v1")
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Baileys Service (`baileys-service/.env`)

Optional:
- `PORT` - Service port (default: 3000)

## API Documentation

Once backend is running:
- **Scalar UI**: http://localhost:5000/scalar/v1
- **OpenAPI JSON**: http://localhost:5000/openapi/v1.json

Scalar theme: Purple (configured in `Program.cs:149-155`)

## Common Development Tasks

### Add New Entity to Database

1. Create entity class in `backend/src/WhatsApp.Core/Entities/`
2. Add `DbSet<YourEntity>` to `SupabaseContext.cs`
3. Configure entity in `OnModelCreating()` with table name, columns, indexes
4. Create migration: `dotnet ef migrations add AddYourEntity --startup-project ../WhatsApp.API`
5. Migration applied automatically on next startup

### Add New API Endpoint

1. Create DTO in `backend/src/WhatsApp.API/DTOs/`
2. Add method to service interface in `WhatsApp.Core/Interfaces/`
3. Implement method in service class in `WhatsApp.Infrastructure/Services/`
4. Create controller action in `WhatsApp.API/Controllers/`
5. Use `[Authorize]` attribute for protected endpoints
6. Use `[Authorize(Roles = "Admin")]` for admin-only endpoints

### Add New Redux Slice (Frontend)

1. Create slice file in `frontend/src/store/slices/yourSlice.ts`
2. Define state interface, initial state, async thunks, reducers
3. Register reducer in `frontend/src/store/index.ts`
4. Export types: `RootState['yourSlice']`
5. Use in components: `useSelector((state) => state.yourSlice)`

## Debugging

### Backend (.NET)

Visual Studio / Rider: Open `backend/WhatsAppMicroservice.sln`

VS Code: Launch configuration:
```json
{
  "name": ".NET Core Launch",
  "type": "coreclr",
  "request": "launch",
  "program": "${workspaceFolder}/backend/src/WhatsApp.API/bin/Debug/net9.0/WhatsApp.API.dll",
  "cwd": "${workspaceFolder}/backend/src/WhatsApp.API",
  "env": { "ASPNETCORE_ENVIRONMENT": "Development" }
}
```

### Baileys Service (Node.js)

```bash
cd baileys-service
npm run dev  # ts-node-dev with auto-reload
```

Set breakpoints in VS Code with Node.js debugger attached.

### Frontend (React)

Browser DevTools + React Developer Tools extension.

Redux DevTools extension for inspecting state changes.

## Estado do Desenvolvimento

### Fase 1 - MVP ✅ CONCLUÍDA

Todas as funcionalidades básicas foram implementadas e testadas:
- ✅ Setup completo do projeto (.NET 9 + React + Baileys Service)
- ✅ Integração com Supabase (PostgreSQL)
- ✅ Sistema multi-tenancy funcional com middleware
- ✅ Provider Baileys integrado e operacional
- ✅ API de mensagens de texto, mídia, áudio e localização
- ✅ Sistema de autenticação JWT completo
- ✅ CRUD de usuários e sessões
- ✅ Frontend React com Redux Toolkit e React Query
- ✅ Chat em tempo real com componentes de UI modernos

### Fase 2 - Features Core 🚧 EM PROGRESSO

Próximos passos planejados:
- ⏳ Integração Meta WhatsApp Business API (MetaApiProvider)
- ⏳ Chaveamento dinâmico entre providers (ProviderFactory)
- ⏳ Sistema de fallback automático
- ⏳ Integração completa Supabase Realtime
- ⏳ Sistema de cache com Redis
- ⏳ Dashboard avançado de métricas

### Fase 3 - IA e Automação 📋 PLANEJADA

Features de IA para futuro:
- 📋 Integração com agentes de IA (OpenAI/Azure OpenAI)
- 📋 Sistema de contexto de conversação
- 📋 Templates de agentes especializados
- 📋 Endpoints de gestão de agentes
- 📋 Processamento automático de mensagens

### Fase 4 - Produção 📋 PLANEJADA

Preparação para produção:
- 📋 Testes E2E completos
- 📋 CI/CD com GitHub Actions
- 📋 Monitoramento avançado (Application Insights/Datadog)
- 📋 Segurança e hardening
- 📋 Deploy em cloud (AWS/Azure/GCP)

## Key Architectural Decisions

### Why Clean Architecture?

- **Testability**: Core business logic independent of framework/database
- **Flexibility**: Swap providers (Baileys → Meta API) without touching controllers
- **Maintainability**: Clear separation of concerns across layers

### Why Separate Baileys Service?

- **Technology fit**: Baileys library is Node.js-only
- **Isolation**: WhatsApp Web protocol instability doesn't crash main API
- **Scalability**: Horizontal scaling of Baileys instances independent of API

### Why Auto-Migration?

- **Simplicity**: No manual deployment steps for database changes
- **Consistency**: Schema always in sync with code on startup
- **Development speed**: Instant schema updates during rapid iteration

### Why JSONB for Settings/Content?

- **Flexibility**: Schema-free storage for provider-specific data
- **Performance**: PostgreSQL JSONB indexing for fast queries
- **Versioning**: Easy to add new fields without migrations

## Troubleshooting

### Backend não inicia

**Problema:** `Failed to connect to database`
- **Solução:** Verifique a connection string em `appsettings.json`
- **Solução:** Confirme que o Supabase está acessível
- **Solução:** Verifique se o schema `whatsapp_service` existe no banco

**Problema:** `JWT validation failed`
- **Solução:** Verifique se `Jwt:Key` tem pelo menos 32 caracteres
- **Solução:** Confirme que Issuer e Audience estão configurados corretamente

### Baileys Service não conecta

**Problema:** Backend retorna erro ao inicializar sessão
- **Solução:** Verifique se Baileys service está rodando em `http://localhost:3000`
- **Solução:** Confira health check: `curl http://localhost:5000/health`
- **Solução:** Verifique logs do Baileys service: `cd baileys-service && npm run dev`

**Problema:** QR Code não aparece
- **Solução:** Verifique se o endpoint `/session/initialize` do Baileys está respondendo
- **Solução:** Confirme que session_data está sendo salvo no banco corretamente

### Frontend não carrega dados

**Problema:** Erro 401 Unauthorized
- **Solução:** Faça login novamente para obter token válido
- **Solução:** Verifique se `X-Client-Id` está sendo enviado nos headers
- **Solução:** Confirme que o token JWT não expirou (exp claim)

**Problema:** Erro CORS
- **Solução:** Verifique configuração de CORS em `Program.cs:51-61`
- **Solução:** Confirme que `http://localhost:3000` está nas origins permitidas

### Sessão desconecta frequentemente

**Problema:** WhatsApp desconecta após alguns minutos
- **Solução:** Isso é comportamento normal do Baileys. Implemente reconexão automática
- **Solução:** Salve session_data corretamente para permitir reconexão sem QR Code
- **Solução:** Monitore eventos de desconexão e tente reconectar automaticamente

### Mensagens não são enviadas

**Problema:** Status fica em "pending"
- **Solução:** Verifique se a sessão está ativa: `GET /api/v1/sessions/status`
- **Solução:** Confirme que o número está no formato correto (sem "+" e com código do país)
- **Solução:** Verifique logs do Baileys service para erros específicos

**Problema:** Erro "Phone number not connected"
- **Solução:** Inicialize a sessão primeiro: `POST /api/v1/sessions/initialize`
- **Solução:** Escaneie o QR Code retornado com WhatsApp no celular

## Como Testar o Sistema Completo

### 1. Teste de Autenticação

```bash
# Login como admin
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123",
    "clientId": "a4876b9d-8ce5-4b67-ab69-c04073ce2f80"
  }'

# Salvar o token retornado em uma variável
TOKEN="<token-retornado>"
CLIENT_ID="a4876b9d-8ce5-4b67-ab69-c04073ce2f80"
```

### 2. Teste de Inicialização de Sessão

```bash
# Inicializar sessão WhatsApp
curl -X POST http://localhost:5000/api/v1/sessions/initialize \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "providerType": "baileys"
  }'

# Retorna QR Code base64 - escanear com WhatsApp no celular
```

### 3. Teste de Envio de Mensagem

```bash
# Enviar mensagem de texto
curl -X POST http://localhost:5000/api/v1/messages/text \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511888888888",
    "text": "Olá! Esta é uma mensagem de teste."
  }'
```

### 4. Teste de Health Check

```bash
# Verificar saúde do sistema
curl http://localhost:5000/health

# Deve retornar:
# {
#   "status": "Healthy",
#   "checks": {
#     "database": "Healthy",
#     "baileys_service": "Healthy"
#   }
# }
```

### 5. Teste Frontend

1. Abra http://localhost:3000
2. Login com: `admin@test.com` / `Admin@123`
3. Navegue para "Sessões" e crie nova sessão
4. Escaneie QR Code com WhatsApp
5. Navegue para "Conversas" e envie mensagens

## Performance Tips

### Database Queries

- Use indexes apropriados em queries frequentes
- Sempre filtre por `tenant_id` primeiro
- Use paginação para listas grandes
- Consider connection pooling (já configurado)

### Message Processing

- Implemente filas (RabbitMQ/Redis) para envio em massa
- Use background jobs para processamento pesado
- Cache session data para evitar DB hits

### Frontend

- Use React Query para cache automático
- Lazy load páginas que não são usadas inicialmente
- Otimize re-renders com `useMemo` e `useCallback`
- Use virtual scrolling para listas longas de mensagens
