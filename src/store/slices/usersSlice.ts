import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User, UsersQueryParams, UpdateUserRequest, UsersResponse, PlayersResponse, UserResponse, UpdateUserResponse } from '../../types/api';
import { api } from '../../lib/api';

interface UsersState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params: UsersQueryParams, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const response = await api.get<UsersResponse>(`/users?${queryString}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }
);

export const fetchPlayers = createAsyncThunk(
  'users/fetchPlayers',
  async (params: Partial<UsersQueryParams>, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const response = await api.get<PlayersResponse>(`/users/players?${queryString}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch players');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<UserResponse>(`/users/${id}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }: { id: string; userData: UpdateUserRequest }, { rejectWithValue }) => {
    try {
      const response = await api.put<UpdateUserResponse>(`/users/${id}`, userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update user');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearUsers: (state) => {
      state.users = [];
      state.pagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.users = payload?.data?.data || [];  // Fix: access nested data.data
        state.pagination = payload?.pagination || null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch users';
      })
      // Fetch Players
      .addCase(fetchPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayers.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.users = payload?.data?.data || [];  // Fix: access nested data.data
        state.pagination = payload?.pagination || null;
      })
      .addCase(fetchPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch players';
      })
      // Fetch User
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (payload?.data) {
          state.currentUser = payload.data;
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch user';
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (payload?.data) {
          state.currentUser = payload.data;
          // Update user in users array if exists
          const index = state.users.findIndex(user => user.id === payload.data.id);
          if (index !== -1) {
            state.users[index] = payload.data;
          }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update user';
      });
  },
});

export const { clearError, setCurrentUser, clearUsers } = usersSlice.actions;
export default usersSlice.reducer; 