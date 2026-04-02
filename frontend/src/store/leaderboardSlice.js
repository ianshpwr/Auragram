// src/store/leaderboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getGlobalLeaderboardApi, getCategoryLeaderboardApi, getMyRankApi } from '../api/leaderboard.js';

export const fetchGlobalLeaderboard = createAsyncThunk(
  'leaderboard/fetchGlobal',
  async (_, { rejectWithValue }) => {
    try {
      return await getGlobalLeaderboardApi();
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load leaderboard');
    }
  }
);

export const fetchCategoryLeaderboard = createAsyncThunk(
  'leaderboard/fetchCategory',
  async (category, { rejectWithValue }) => {
    try {
      const data = await getCategoryLeaderboardApi(category);
      return { category, data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load leaderboard');
    }
  }
);

export const fetchMyRank = createAsyncThunk('leaderboard/fetchMyRank', async (_, { rejectWithValue }) => {
  try {
    return await getMyRankApi();
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch rank');
  }
});

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: {
    global: [],
    byCategory: {},
    myRank: null,
    loading: false,
    error: null,
  },
  reducers: {
    updateGlobalLeaderboard: (state, action) => {
      state.global = action.payload;
    },
    updateCategoryLeaderboard: (state, action) => {
      const { category, data } = action.payload;
      state.byCategory[category] = data;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalLeaderboard.pending, (state) => { state.loading = true; })
      .addCase(fetchGlobalLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.global = action.payload.leaderboard || [];
      })
      .addCase(fetchGlobalLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategoryLeaderboard.fulfilled, (state, action) => {
        const { category, data } = action.payload;
        state.byCategory[category] = data.leaderboard || [];
      })
      .addCase(fetchMyRank.fulfilled, (state, action) => {
        state.myRank = action.payload.rank;
      });
  },
});

export const { updateGlobalLeaderboard, updateCategoryLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
