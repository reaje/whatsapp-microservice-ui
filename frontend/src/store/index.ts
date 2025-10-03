import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sessionReducer from './slices/sessionSlice';
import chatReducer from './slices/chatSlice';
import tenantReducer from './slices/tenantSlice';
import usersReducer from './slices/usersSlice';
import aiAgentReducer from './slices/aiAgentSlice';
import providerReducer from './slices/providerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    session: sessionReducer,
    chat: chatReducer,
    tenant: tenantReducer,
    users: usersReducer,
    aiAgent: aiAgentReducer,
    provider: providerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state
        ignoredActions: ['chat/addMessage', 'chat/setMessages'],
        ignoredPaths: ['chat.messages'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
