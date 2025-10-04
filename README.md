# WhatsApp Multi-Tenant Frontend

Frontend React para o sistema WhatsApp Multi-Tenant com suporte a Baileys e Meta WhatsApp Business API.

## 🚀 Tecnologias

- **React 18** + TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Redux Toolkit** - State management
- **React Query** - Data fetching
- **React Router v6** - Roteamento
- **React Hook Form** + Zod - Formulários e validação
- **Supabase** - Realtime e Database
- **Axios** - HTTP client

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend API rodando (veja `/backend/README.md`)

## 🔧 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000

### Build de Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── common/         # Componentes reutilizáveis
│   ├── layout/         # Layout components
│   └── features/       # Feature components
├── hooks/              # Custom React hooks
├── pages/              # Páginas da aplicação
├── services/           # Serviços de API
├── store/              # Redux store
├── types/              # TypeScript types
├── utils/              # Funções utilitárias
├── App.tsx             # Componente principal
└── main.tsx            # Entry point
```

## 🔑 Funcionalidades Implementadas

### ✅ Sprint 1 - Fundação
- [x] Configuração do projeto Vite + React + TypeScript
- [x] TailwindCSS configurado
- [x] React Router configurado
- [x] Redux Toolkit configurado
- [x] React Query configurado
- [x] Serviços de API criados
- [x] Layout base (Header, Sidebar)
- [x] Página de Login
- [x] Páginas stub (Dashboard, Sessions, Conversations, Settings)

### 🚧 Em Desenvolvimento
- [ ] Gerenciamento de Sessões WhatsApp
- [ ] Interface de Chat
- [ ] Envio de diferentes tipos de mensagem
- [ ] Integração Supabase Realtime
- [ ] Dashboard com métricas

## 📚 Documentação

- [Planejamento Frontend](./PLANEJAMENTO_FRONTEND.md) - Planejamento completo
- [Guia de Implementação](./react-implementation-guide.md) - Guia detalhado
- [Flowchart](./react-frontend-flowchart.svg) - Arquitetura visual

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Docker
```bash
docker build -t whatsapp-frontend .
docker run -p 80:80 whatsapp-frontend
```

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

## 🔐 Autenticação

O sistema usa autenticação baseada em JWT com Client-ID para multi-tenancy.

Todas as requisições incluem:
```http
X-Client-Id: {tenant-client-id}
Authorization: Bearer {jwt-token}
```

## 📝 Próximos Passos

1. Implementar gerenciamento de sessões com QR Code
2. Desenvolver interface de chat completa
3. Adicionar suporte a diferentes tipos de mensagem
4. Integrar Supabase Realtime
5. Criar dashboard com métricas

## 🐛 Reportar Bugs

Entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Propriedade da Ventry.

---

**Status**: 🟡 Em Desenvolvimento (Sprint 1 Completa)
