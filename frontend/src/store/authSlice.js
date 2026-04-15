// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginApi, registerApi, logoutApi, getMeApi } from '../api/auth.js';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await loginApi(credentials);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await registerApi(userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutApi();
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Logout failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const data = await getMeApi();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
    },
    updateUserScore: (state, action) => {
      if (state.user) {
        state.user.auraScore = action.payload.newScore;
        state.user.tier = action.payload.tier;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user ?? null;
        state.accessToken = action.payload?.accessToken ?? null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user ?? null;
        state.accessToken = action.payload?.accessToken ?? null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        // Backend /auth/me returns the user object directly (not wrapped in {user})
        state.user = action.payload ?? null;
        // accessToken is cookie-based; mark as 'cookie' so SocketContext knows we're authed
        if (action.payload) state.accessToken = 'cookie';
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
      });
  },
});

export const { setUser, setAccessToken, clearAuth, updateUserScore } = authSlice.actions;
export default authSlice.reducer;
