// src/components/Feed.jsx
// Infinite scroll feed with cursor pagination

import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed } from '../store/feedSlice.js';
import PostCard from './PostCard.jsx';

export function Feed({ category }) {
  const dispatch = useDispatch();
  const { posts, nextCursor, hasMore, loading } = useSelector((s) => s.feed);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchFeed({ category }));
  }, [category]);

  // Infinite scroll observer
  const loadMore = useCallback(() => {
    if (!loading && hasMore && nextCursor) {
      dispatch(fetchFeed({ cursor: nextCursor, category }));
    }
  }, [loading, hasMore, nextCursor, category]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-4/5" />
                <div className="skeleton h-4 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-white/20 text-sm">
          You've reached the end ✦
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">✦</p>
          <p className="text-white/40">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}

export default Feed;
