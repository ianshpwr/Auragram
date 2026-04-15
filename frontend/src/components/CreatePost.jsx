// src/components/CreatePost.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPostApi } from '../api/posts.js';
import { prependPost } from '../store/feedSlice.js';

const CATEGORIES = ['tech', 'art', 'science', 'gaming', 'culture'];

const CATEGORY_PLACEHOLDERS = {
  tech: 'Share a tech insight, tool, or discovery...',
  art: 'Share your creative work or artistic perspective...',
  science: 'Share a scientific discovery or research finding...',
  gaming: 'Share your gaming thoughts, tips, or highlights...',
  culture: 'Share a cultural observation or trend...',
};

export function CreatePost({ onSuccess }) {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('tech');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');

    try {
      const post = await createPostApi({ content, category });
      // Backend returns raw post (no populated authorId).
      // Manually attach the current user so PostCard doesn't crash.
      const enrichedPost = {
        ...post,
        authorId: post.authorId ?? authUser,
        engagements: post.engagements ?? { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      };
      dispatch(prependPost(enrichedPost));
      setContent('');
      setExpanded(false);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const charLimit = 1000;

  return (
    <div className="card p-5">
      <form onSubmit={handleSubmit} id="create-post-form">
        {/* Category selector */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`category-${cat}`}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
                category === cat
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70 bg-white/5'
              }`}
              style={category === cat ? {
                background: 'linear-gradient(135deg, #39ff14, #0cbaba)',
              } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder={CATEGORY_PLACEHOLDERS[category] || 'Share something with the community...'}
            maxLength={charLimit}
            className="input-field resize-none transition-all duration-200"
            style={{ minHeight: expanded ? 120 : 56 }}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={`text-xs ${charCount > charLimit * 0.9 ? 'text-yellow-400' : 'text-white/20'}`}>
              {charCount}/{charLimit}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-2 animate-fade-in">{error}</p>
        )}

        {expanded && (
          <div className="flex justify-end gap-2 mt-3 animate-fade-in">
            <button
              type="button"
              onClick={() => { setExpanded(false); setContent(''); }}
              className="btn-ghost text-sm"
            >
              Cancel
            </button>
            <button
              id="submit-post"
              type="submit"
              disabled={loading || !content.trim()}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : '✦ Post'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default CreatePost;
