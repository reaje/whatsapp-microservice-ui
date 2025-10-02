import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Tenant, TenantSettings } from '@/types';
import { api } from '@/services/api';

interface TenantState {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  tenant: null,
  loading: false,
  error: null,
};

// Async thunk to fetch tenant
export const fetchTenant = createAsyncThunk(
  'tenant/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Tenant>('/api/v1/tenant/settings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar tenant');
    }
  }
);

// Async thunk to update tenant settings
export const updateTenantSettings = createAsyncThunk(
  'tenant/updateSettings',
  async (settings: TenantSettings, { rejectWithValue }) => {
    try {
      const response = await api.put<Tenant>('/api/v1/tenant/settings', { settings });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar configurações');
    }
  }
);

export const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (state, action: PayloadAction<Tenant>) => {
      state.tenant = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch tenant
    builder.addCase(fetchTenant.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTenant.fulfilled, (state, action) => {
      state.loading = false;
      state.tenant = action.payload;
      state.error = null;
    });
    builder.addCase(fetchTenant.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update tenant settings
    builder.addCase(updateTenantSettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTenantSettings.fulfilled, (state, action) => {
      state.loading = false;
      state.tenant = action.payload;
      state.error = null;
    });
    builder.addCase(updateTenantSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setTenant, setLoading, clearError } = tenantSlice.actions;
export default tenantSlice.reducer;
