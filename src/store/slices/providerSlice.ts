import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { providerService } from '@/services/provider.service';
import type {
  ProviderStatsMap,
  ProviderHealthResponse,
  RecommendedProviderResponse,
  ProviderType,
} from '@/types/provider.types';

interface ProviderState {
  stats: ProviderStatsMap | null;
  health: ProviderHealthResponse | null;
  recommended: RecommendedProviderResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProviderState = {
  stats: null,
  health: null,
  recommended: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchProviderStats = createAsyncThunk('provider/fetchStats', async () => {
  return await providerService.getStats();
});

export const fetchProviderHealth = createAsyncThunk(
  'provider/fetchHealth',
  async (providerType: ProviderType) => {
    return await providerService.getHealth(providerType);
  }
);

export const fetchRecommendedProvider = createAsyncThunk(
  'provider/fetchRecommended',
  async (preferredProvider?: string) => {
    return await providerService.getRecommended(preferredProvider);
  }
);

export const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchProviderStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderStats.fulfilled, (state, action: PayloadAction<ProviderStatsMap>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchProviderStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar estatísticas dos providers';
      })
      // Fetch health
      .addCase(fetchProviderHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProviderHealth.fulfilled,
        (state, action: PayloadAction<ProviderHealthResponse>) => {
          state.loading = false;
          state.health = action.payload;
        }
      )
      .addCase(fetchProviderHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao verificar saúde do provider';
      })
      // Fetch recommended
      .addCase(fetchRecommendedProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRecommendedProvider.fulfilled,
        (state, action: PayloadAction<RecommendedProviderResponse>) => {
          state.loading = false;
          state.recommended = action.payload;
        }
      )
      .addCase(fetchRecommendedProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao buscar provider recomendado';
      });
  },
});

export const { clearError } = providerSlice.actions;
export default providerSlice.reducer;
