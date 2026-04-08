// src/components/ScoreWidget.jsx
// Large score display with sparkline, tier badge, and global rank

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSocketContext } from '../context/SocketContext.jsx';
import { getUserApi } from '../api/users.js';
import { getMyRankApi } from '../api/leaderboard.js';
import AuraBadge from './AuraBadge.jsx';
import TierBadge from './TierBadge.jsx';
import { formatScore, formatRank, formatDelta } from '../utils/formatScore.js';
import { getTierColors } from '../utils/tierColors.js';

function Sparkline({ history = [], color = '#39ff14', width = 120, height = 36 }) {
  if (!history || history.length < 2) return null;

  const scores = history.map((h) => h.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width;
    const y = height - ((s - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(scores.length - 1) / (scores.length - 1) * width}
        cy={height - ((scores[scores.length - 1] - min) / range) * (height - 4) - 2}
        r="3"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

export function ScoreWidget({ userId }) {
  const [userData, setUserData] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevScore, setPrevScore] = useState(null);
  const [scoreFlash, setScoreFlash] = useState(null);
  const authUser = useSelector((s) => s.auth.user);
  const { socket } = useSocketContext() || {};
  const isOwnWidget = authUser?._id === userId;

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const load = async () => {
      try {
        const [user, rankData] = await Promise.all([
          getUserApi(userId),
          getMyRankApi().catch(() => ({ rank: null })),
        ]);
        if (mounted) {
          setUserData(user);
          setRank(rankData.rank || user.globalRank);
          setPrevScore(user.auraScore);
        }
      } catch (err) {
        console.error('[ScoreWidget]', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleUpdate = (data) => {
      if (data.userId === userId) {
        setUserData((prev) => {
          if (!prev) return prev;
          const delta = data.newScore - prev.auraScore;
          setScoreFlash(delta);
          setTimeout(() => setScoreFlash(null), 2000);
          return { ...prev, auraScore: data.newScore, tier: data.tier };
        });
      }
    };

    socket.on('aura_update', handleUpdate);
    return () => socket.off('aura_update', handleUpdate);
  }, [socket, userId]);

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="skeleton h-24 w-24 rounded-full mx-auto mb-4" />
        <div className="skeleton h-8 w-32 mx-auto mb-2" />
        <div className="skeleton h-4 w-20 mx-auto" />
      </div>
    );
  }

  if (!userData) return null;

  const colors = getTierColors(userData.tier);

  return (
    <div className="card p-6 text-center space-y-4">
      {/* Aura badge */}
      <div className="flex justify-center">
        <AuraBadge score={userData.auraScore} tier={userData.tier} size="lg" />
      </div>

      {/* Score */}
      <div>
        <div className="flex items-center justify-center gap-2">
          <span
            className="text-4xl font-black font-display"
            style={{ color: colors.text, textShadow: `0 0 20px ${colors.ring}40` }}
          >
            {formatScore(userData.auraScore)}
          </span>
          {scoreFlash !== null && (
            <span
              className="text-sm font-semibold animate-fade-in"
              style={{ color: scoreFlash >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {formatDelta(scoreFlash)}
            </span>
          )}
        </div>
        <p className="text-white/40 text-sm mt-1">Aura Score</p>
      </div>

      {/* Tier badge */}
      <div className="flex justify-center">
        <TierBadge tier={userData.tier} size="lg" />
      </div>

      {/* Rank */}
      {rank && (
        <div className="text-white/50 text-sm">
          Global Rank: <span className="text-white font-semibold">{formatRank(rank)}</span>
        </div>
      )}

      {/* Sparkline */}
      {userData.scoreHistory?.length >= 2 && (
        <div className="flex flex-col items-center gap-1">
          <Sparkline history={userData.scoreHistory} color={colors.ring} width={160} height={40} />
          <p className="text-white/30 text-xs">Last 30 data points</p>
        </div>
      )}
    </div>
  );
}

export default ScoreWidget;
