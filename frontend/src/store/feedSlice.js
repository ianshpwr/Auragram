// src/store/feedSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFeedApi } from '../api/posts.js';

export const fetchFeed = createAsyncThunk('feed/fetch', async ({ cursor, category } = {}, { rejectWithValue }) => {
  try {
    const data = await getFeedApi({ cursor, limit: 20, category });
    return { ...data, fresh: !cursor };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load feed');
  }
});

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    nextCursor: null,
    hasMore: true,
    loading: false,
    error: null,
  },
  reducers: {
    prependPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePostEngagements: (state, action) => {
      const { postId, engagements } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) post.engagements = { ...post.engagements, ...engagements };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, nextCursor, hasMore, fresh } = action.payload;
        state.posts = fresh ? posts : [...state.posts, ...posts];
        state.nextCursor = nextCursor;
        state.hasMore = hasMore;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { prependPost, updatePostEngagements } = feedSlice.actions;
export default feedSlice.reducer;
