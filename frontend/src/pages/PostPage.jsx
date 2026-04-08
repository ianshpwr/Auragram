// src/pages/PostPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPostApi, getCommentsApi } from '../api/posts.js';
import PostCard from '../components/PostCard.jsx';
import { formatRelativeTime } from '../utils/formatScore.js';
import TierBadge from '../components/TierBadge.jsx';

export function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          getPostApi(id),
          getCommentsApi(id),
        ]);
        setPost(postData);
        setComments(commentsData.comments || []);
        setNextCursor(commentsData.nextCursor);
      } catch (err) {
        console.error('[PostPage]', err.message);
        if (err.response?.status === 404) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const loadMoreComments = async () => {
    if (!nextCursor || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const data = await getCommentsApi(id, { cursor: nextCursor });
      setComments((prev) => [...prev, ...(data.comments || [])]);
      setNextCursor(data.nextCursor);
    } finally {
      setCommentsLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card p-8 animate-pulse space-y-4">
        <div className="flex gap-4">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
        <div className="skeleton h-24 w-full" />
      </div>
    </div>
  );

  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        id="post-page-back"
      >
        ← Back
      </button>

      {/* Main post */}
      <PostCard post={post} showCommentInput={!!user} />

      {/* Comments section */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">
            Comments <span className="text-white/30 font-normal text-sm">({post.engagements?.comments || 0})</span>
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {comments.map((comment) => (
            <div key={comment._id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #39ff14, #0cbaba)' }}>
                  {comment.actorId?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {comment.actorId?.username || '[deleted]'}
                    </span>
                    <TierBadge tier={comment.actorId?.tier || 'Dormant'} size="xs" />
                    <span className="text-white/30 text-xs">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {comment.metadata?.content || '[comment]'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
              No comments yet. Start the conversation!
            </div>
          )}
        </div>

        {nextCursor && (
          <div className="px-5 py-4 border-t border-white/5">
            <button onClick={loadMoreComments} disabled={commentsLoading} className="btn-secondary w-full text-sm">
              {commentsLoading ? 'Loading...' : 'Load more comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostPage;
