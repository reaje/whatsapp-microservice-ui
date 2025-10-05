# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsApp Multi-Tenant Frontend - A React-based web application for managing WhatsApp sessions using both Baileys and Meta WhatsApp Business API. This is part of a microservice architecture with a .NET backend API.

**Communication Language:** Portuguese Brazilian (pt-BR) - All UI strings, comments, and documentation should be in Brazilian Portuguese.

## Development Commands

### Running the Application
```bash
npm run dev          # Start dev server on http://localhost:3001
npm run build        # Build for production (runs TypeScript check first)
npm run preview      # Preview production build
```

### Testing
```bash
npm run test              # Run unit tests with Vitest
npm run test:e2e          # Run E2E tests with Playwright
npm run test:coverage     # Generate test coverage report
```

### Code Quality
```bash
npm run lint         # Run ESLint on TypeScript/TSX files
```

## Environment Configuration

Required environment variables in `.env`:
- `VITE_API_URL` - Backend API base URL (default: http://localhost:5278/api/v1)
- `VITE_SUPABASE_URL` - Supabase project URL for realtime features
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_APP_ENV` - Environment (development/production)

Copy `.env.example` to `.env` before starting development.

## Architecture Overview

### State Management Strategy
- **Redux Toolkit** for global application state (auth, sessions, chat, tenant)
- **React Query** for server state management and caching
- Local component state with `useState` for UI-only state

Key Redux slices:
- `authSlice` - Authentication state (user, token, clientId)
- `sessionSlice` - WhatsApp session management
- `chatSlice` - Active conversations and messages
- `tenantSlice` - Tenant configuration and limits

### API Communication
- All API calls go through the configured Axios instance in `src/services/api.ts`
- Automatic injection of JWT token (`Authorization: Bearer <token>`)
- Automatic injection of tenant identifier (`X-Client-Id: <clientId>`)
- Automatic redirect to login on 401 responses
- Error handling through `handleApiError` utility

### Realtime Updates
Uses Supabase for realtime features (messages, session status):
- `supabaseService.subscribeToMessages()` - New message notifications
- `supabaseService.subscribeToMessageStatus()` - Message delivery status updates
- `supabaseService.subscribeToSessionStatus()` - WhatsApp session state changes

All subscriptions should be cleaned up in component unmount.

### Routing & Authentication
- React Router v6 with lazy-loaded pages
- `ProtectedRoute` wrapper requires authentication
- Auth persistence via localStorage
- Auto-redirect to dashboard if already authenticated

Routes defined in `src/utils/constants.ts`:
- `/login` - Authentication page
- `/dashboard` - Main dashboard with metrics
- `/sessions` - WhatsApp session management (QR codes, status)
- `/conversations` - Chat interface
- `/settings` - Tenant configuration

### Multi-Tenancy
All authenticated requests include:
- `X-Client-Id` header (tenant identifier)
- JWT token in `Authorization` header

Tenant isolation is enforced by the backend. The frontend stores `clientId` alongside auth token.

## Key Technical Patterns

### Import Aliases
Use `@/` for absolute imports from `src/` directory:
```typescript
import { api } from '@/services/api';
import { ROUTES } from '@/utils/constants';
```

### Component Structure
- Feature components in `src/components/features/` organized by domain (sessions, chat, dashboard, settings)
- Reusable UI components in `src/components/common/`
- Layout components in `src/components/layout/`
- Each component in its own directory with an `index.tsx`

### Custom Hooks
- `useSession` - Session management logic (initialize, get QR code, disconnect)
- `useMessage` - Message operations (send text/media, fetch history)

### Type Definitions
All TypeScript types centralized in `src/types/`:
- `auth.types.ts` - Authentication & user types
- `session.types.ts` - WhatsApp session types
- `message.types.ts` - Message types (text, image, video, audio, document, location)
- `tenant.types.ts` - Tenant configuration types

## PWA Configuration

The app is configured as a Progressive Web App using `vite-plugin-pwa`:
- Offline support via service worker
- Network-first strategy for API calls (24h cache)
- Manifest configured for WhatsApp Multi-Tenant branding

## Sprint Progress

The project follows a sprint-based development approach:
- **Sprint 1** ✅ - Foundation (Vite setup, routing, Redux, API services, base layout, login page)
- **Sprint 2+** 🚧 - Session management, chat interface, dashboard metrics, settings pages

Refer to `SPRINT_*_SUMMARY.md` files for detailed sprint completion status.

## Backend Integration

The frontend expects the .NET backend API to be running on `VITE_API_URL`. The API provides:
- `/auth/*` - Authentication endpoints
- `/sessions/*` - WhatsApp session CRUD operations
- `/messages/*` - Message operations (send/receive)
- `/tenants/*` - Tenant configuration

## Development Notes

- The dev server proxies `/api` requests to `http://localhost:5278` (see `vite.config.ts`)
- TailwindCSS is configured with custom theme colors
- ESLint enforces React Hooks rules and TypeScript best practices
- Strict TypeScript mode enabled
