// src/components/PostCard.jsx
// Post card with engagement actions feeding the event pipeline

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { likePostApi, sharePostApi, bookmarkPostApi, commentPostApi } from '../api/posts.js';
import AuraBadge from './AuraBadge.jsx';
import TierBadge from './TierBadge.jsx';
import { formatScore, formatRelativeTime } from '../utils/formatScore.js';
import { getTierColors } from '../utils/tierColors.js';

const CATEGORY_COLORS = {
  tech: '#06b6d4',
  art: '#ec4899',
  science: '#22c55e',
  gaming: '#f59e0b',
  culture: '#a855f7',
};

function EngagementButton({ icon, count, active, onClick, loading, color = 'rgba(255,255,255,0.5)', id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200
        ${active ? 'bg-brand-500/20' : 'hover:bg-white/5'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
      `}
      style={{ color: active ? color : 'rgba(255,255,255,0.45)' }}
    >
      <span className="text-base">{icon}</span>
      <span className="text-xs">{count ?? 0}</span>
    </button>
  );
}

export function PostCard({ post, showCommentInput = false }) {
  const user = useSelector((s) => s.auth.user);
  // authorId may be a populated object OR a raw ObjectId string (cache miss / raw create)
  const author = post.authorId && typeof post.authorId === 'object' ? post.authorId : null;
  const colors = getTierColors(author?.tier);

  const [engagements, setEngagements] = useState(
    typeof post.engagements === 'object' && post.engagements !== null
      ? post.engagements
      : { likes: 0, comments: 0, shares: 0, bookmarks: 0 }
  );
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentOpen, setCommentOpen] = useState(showCommentInput);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState({});

  const setActionLoading = (action, val) =>
    setLoading((prev) => ({ ...prev, [action]: val }));

  const handleLike = async () => {
    if (!user || liked) return;
    setActionLoading('like', true);
    try {
      await likePostApi(post._id);
      setLiked(true);
      setEngagements((prev) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    } catch (err) {
      console.error('[PostCard] Like failed:', err.message);
    } finally {
      setActionLoading('like', false);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    setActionLoading('share', true);
    try {
      await sharePostApi(post._id);
      setEngagements((prev) => ({ ...prev, shares: (prev.shares || 0) + 1 }));
    } catch (err) {
      console.error('[PostCard] Share failed:', err.message);
    } finally {
      setActionLoading('share', false);
    }
  };

  const handleBookmark = async () => {
    if (!user || bookmarked) return;
    setActionLoading('bookmark', true);
    try {
      await bookmarkPostApi(post._id);
      setBookmarked(true);
      setEngagements((prev) => ({ ...prev, bookmarks: (prev.bookmarks || 0) + 1 }));
    } catch (err) {
      console.error('[PostCard] Bookmark failed:', err.message);
    } finally {
      setActionLoading('bookmark', false);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;
    setActionLoading('comment', true);
    try {
      await commentPostApi(post._id, commentText);
      setEngagements((prev) => ({ ...prev, comments: (prev.comments || 0) + 1 }));
      setCommentText('');
      setCommentOpen(false);
    } catch (err) {
      console.error('[PostCard] Comment failed:', err.message);
    } finally {
      setActionLoading('comment', false);
    }
  };

  return (
    <article
      id={`post-${post._id}`}
      className="card-hover p-5 animate-fade-in"
    >
      {/* Author header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile/${author?._id}`} className="shrink-0">
            <AuraBadge score={author?.auraScore || 0} tier={author?.tier || 'Dormant'} size="sm" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile/${author?._id}`}
                className="text-sm font-semibold text-white hover:text-brand-400 transition-colors truncate"
              >
                {author?.username || '[deleted]'}
              </Link>
              <TierBadge tier={author?.tier || 'Dormant'} size="xs" />
            </div>
            <p className="text-white/30 text-xs">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>

        {/* Category tag */}
        <span
          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
          style={{
            background: `${CATEGORY_COLORS[post.category]}20`,
            color: CATEGORY_COLORS[post.category],
            border: `1px solid ${CATEGORY_COLORS[post.category]}30`,
          }}
        >
          {post.category}
        </span>
      </div>

      {/* Content */}
      <Link to={`/post/${post._id}`}>
        <p className="text-white/85 leading-relaxed mb-4 hover:text-white transition-colors">
          {post.content}
        </p>
      </Link>

      {/* Aura impact */}
      {post.auraImpact > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs text-white/30">Aura Impact:</span>
          <span className="text-xs font-semibold" style={{ color: getTierColors(author?.tier).text }}>
            +{formatScore(post.auraImpact)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/5 mb-3" />

      {/* Engagement actions */}
      <div className="flex items-center gap-1 flex-wrap">
        <EngagementButton
          id={`like-${post._id}`}
          icon="♥"
          count={engagements.likes}
          active={liked}
          onClick={handleLike}
          loading={loading.like}
          color="#ef4444"
        />
        <EngagementButton
          id={`comment-${post._id}`}
          icon="💬"
          count={engagements.comments}
          active={commentOpen}
          onClick={() => setCommentOpen((v) => !v)}
          loading={false}
          color="#60a5fa"
        />
        <EngagementButton
          id={`share-${post._id}`}
          icon="↗"
          count={engagements.shares}
          active={false}
          onClick={handleShare}
          loading={loading.share}
          color="#22c55e"
        />
        <EngagementButton
          id={`bookmark-${post._id}`}
          icon="🔖"
          count={engagements.bookmarks}
          active={bookmarked}
          onClick={handleBookmark}
          loading={loading.bookmark}
          color="#f59e0b"
        />
      </div>

      {/* Comment input */}
      {commentOpen && user && (
        <div className="mt-3 flex gap-2 animate-fade-in">
          <input
            id={`comment-input-${post._id}`}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            placeholder="Write a comment..."
            className="input-field text-sm py-2 flex-1"
            maxLength={500}
          />
          <button
            onClick={handleComment}
            disabled={loading.comment || !commentText.trim()}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </article>
  );
}

export default PostCard;
