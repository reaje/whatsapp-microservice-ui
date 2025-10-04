import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, CreateUserRequest, UpdateUserRequest, UpdatePasswordRequest } from '@/types/user.types';
import { api } from '@/services/api';

interface UsersState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
};

// Async thunk to fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<User[]>('/user');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar usuários');
    }
  }
);

// Async thunk to fetch user by ID
export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<User>(`/user/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar usuário');
    }
  }
);

// Async thunk to create user
export const createUser = createAsyncThunk(
  'users/create',
  async (userData: CreateUserRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<User>('/user', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar usuário');
    }
  }
);

// Async thunk to update user
export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: UpdateUserRequest }, { rejectWithValue }) => {
    try {
      const response = await api.put<User>(`/user/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar usuário');
    }
  }
);

// Async thunk to update user password
export const updateUserPassword = createAsyncThunk(
  'users/updatePassword',
  async ({ id, data }: { id: string; data: UpdatePasswordRequest }, { rejectWithValue }) => {
    try {
      await api.put(`/user/${id}/password`, data);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar senha');
    }
  }
);

// Async thunk to deactivate user
export const deactivateUser = createAsyncThunk(
  'users/deactivate',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.post(`/user/${id}/deactivate`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao desativar usuário');
    }
  }
);

// Async thunk to delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/user/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao deletar usuário');
    }
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
      state.error = null;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch user by ID
    builder.addCase(fetchUserById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedUser = action.payload;
      state.error = null;
    });
    builder.addCase(fetchUserById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create user
    builder.addCase(createUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users.push(action.payload);
      state.error = null;
    });
    builder.addCase(createUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user
    builder.addCase(updateUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user password
    builder.addCase(updateUserPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserPassword.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    });
    builder.addCase(updateUserPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Deactivate user
    builder.addCase(deactivateUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deactivateUser.fulfilled, (state, action) => {
      state.loading = false;
      const user = state.users.find((u) => u.id === action.payload);
      if (user) {
        user.isActive = false;
      }
      if (state.selectedUser?.id === action.payload) {
        state.selectedUser.isActive = false;
      }
      state.error = null;
    });
    builder.addCase(deactivateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete user
    builder.addCase(deleteUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users = state.users.filter((u) => u.id !== action.payload);
      if (state.selectedUser?.id === action.payload) {
        state.selectedUser = null;
      }
      state.error = null;
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;
