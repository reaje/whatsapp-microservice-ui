import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Session } from '@/types';

interface SessionState {
  sessions: Session[];
  activeSession: Session | null;
  loading: boolean;
}

const initialState: SessionState = {
  sessions: [],
  activeSession: null,
  loading: false,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<Session>) => {
      const existingIndex = state.sessions.findIndex(s => s.id === action.payload.id);
      if (existingIndex >= 0) {
        state.sessions[existingIndex] = action.payload;
      } else {
        state.sessions.push(action.payload);
      }
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index >= 0) {
        state.sessions[index] = action.payload;
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.activeSession?.id === action.payload) {
        state.activeSession = null;
      }
    },
    setActiveSession: (state, action: PayloadAction<Session | null>) => {
      state.activeSession = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setSessions,
  addSession,
  updateSession,
  removeSession,
  setActiveSession,
  setLoading,
} = sessionSlice.actions;

export default sessionSlice.reducer;
