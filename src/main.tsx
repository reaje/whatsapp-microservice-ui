import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import './index.css';
import { supabaseService } from './services/supabase.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
// Expor store globalmente em ambiente de desenvolvimento/E2E para facilitar mocks nos testes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Helper global para emitir evento de digitação via Supabase Broadcast (para demo/manual)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).__SUPABASE_EMIT_TYPING__ = (contactId: string, isTyping: boolean, source: 'agent' | 'user' = 'agent') => {
  const tenantId = localStorage.getItem('client_id');
  if (!tenantId) return;
  supabaseService.emitTyping(tenantId, contactId, isTyping, source).catch(() => {});
};

;(window as any).__REDUX_STORE__ = store;


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#25D366',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F44336',
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
