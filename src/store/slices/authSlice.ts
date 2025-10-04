import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  clientId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  clientId: null,
  isAuthenticated: false,
  loading: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string; clientId: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.clientId = action.payload.clientId;
      state.isAuthenticated = true;
      state.loading = false;

      // Persist to localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('clientId', action.payload.clientId);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.clientId = null;
      state.isAuthenticated = false;
      state.loading = false;

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('clientId');
      localStorage.removeItem('user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
