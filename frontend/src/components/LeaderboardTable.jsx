// src/components/LeaderboardTable.jsx
// Animated leaderboard with rank, avatar, tier badge, score, 24h delta

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCategoryLeaderboard } from '../store/leaderboardSlice.js';
import TierBadge from './TierBadge.jsx';
import { formatScore, formatDelta } from '../utils/formatScore.js';
import { getTierColors } from '../utils/tierColors.js';

const TABS = ['Global', 'tech', 'art', 'science', 'gaming', 'culture'];

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankChange({ rank, previousRank }) {
  if (!previousRank || rank === previousRank) return null;
  const up = rank < previousRank;
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'}
    </span>
  );
}

function UserAvatar({ username, tier, size = 32 }) {
  const colors = getTierColors(tier);
  const initials = username?.slice(0, 2).toUpperCase() || 'AU';

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-xs shrink-0"
      style={{
        width: size,
        height: size,
        background: colors.gradient,
        color: '#fff',
        fontSize: size * 0.35,
        boxShadow: `0 0 10px ${colors.ring}40`,
      }}
    >
      {initials}
    </div>
  );
}

export function LeaderboardTable({ data = [], loading = false, type = 'Global' }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('Global');
  const [prevRanks, setPrevRanks] = useState({});
  const [highlightedIds, setHighlightedIds] = useState(new Set());

  useEffect(() => {
    if (data.length > 0) {
      // Detect rank changes
      const newHighlights = new Set();
      data.forEach((entry) => {
        const prev = prevRanks[entry.userId];
        if (prev && prev !== entry.rank) {
          newHighlights.add(entry.userId);
        }
      });

      if (newHighlights.size > 0) {
        setHighlightedIds(newHighlights);
        setTimeout(() => setHighlightedIds(new Set()), 2000);
      }

      const newRanks = {};
      data.forEach((entry) => { newRanks[entry.userId] = entry.rank; });
      setPrevRanks(newRanks);
    }
  }, [data]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'Global') dispatch(fetchCategoryLeaderboard(tab));
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-white/5 p-2 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`leaderboard-tab-${tab}`}
            onClick={() => handleTabChange(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-white/30 text-xs font-medium uppercase tracking-wider border-b border-white/5">
        <span className="col-span-1">Rank</span>
        <span className="col-span-5">User</span>
        <span className="col-span-3">Tier</span>
        <span className="col-span-2 text-right">Score</span>
        <span className="col-span-1 text-right">24h</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {data.slice(0, 50).map((entry, index) => {
          const isHighlighted = highlightedIds.has(entry.userId);
          const colors = getTierColors(entry.tier);

          return (
            <div
              key={entry.userId}
              className={`grid grid-cols-12 gap-4 items-center px-4 py-3 transition-all duration-300 hover:bg-white/3 ${
                isHighlighted ? 'animate-rank-highlight' : ''
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center gap-1">
                <span className="text-sm font-bold" style={{ color: entry.rank <= 3 ? colors.text : 'rgba(255,255,255,0.4)' }}>
                  {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
                </span>
              </div>

              {/* User */}
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                <UserAvatar username={entry.username} tier={entry.tier} />
                <Link
                  to={`/profile/${entry.userId}`}
                  className="text-sm font-semibold text-white/90 hover:text-white truncate transition-colors"
                >
                  {entry.username}
                </Link>
              </div>

              {/* Tier */}
              <div className="col-span-3">
                <TierBadge tier={entry.tier} size="xs" />
              </div>

              {/* Score */}
              <div className="col-span-2 text-right">
                <span className="text-sm font-bold" style={{ color: colors.text }}>
                  {formatScore(entry.auraScore)}
                </span>
              </div>

              {/* 24h delta */}
              <div className="col-span-1 text-right">
                <span
                  className="text-xs font-medium"
                  style={{
                    color: entry.delta24h > 0 ? '#22c55e' : entry.delta24h < 0 ? '#ef4444' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {formatDelta(entry.delta24h)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-white/30">
          No leaderboard data yet
        </div>
      )}
    </div>
  );
}

export default LeaderboardTable;
