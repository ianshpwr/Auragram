// src/pages/Leaderboard.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import LeaderboardTable from '../components/LeaderboardTable.jsx';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { formatRank, formatScore } from '../utils/formatScore.js';
import TierBadge from '../components/TierBadge.jsx';

const CATEGORIES = ['tech', 'art', 'science', 'gaming', 'culture'];

export function Leaderboard() {
  const [activeCategory, setActiveCategory] = useState(null);
  const { global: globalBoard, category: catBoard, myRank, loading } = useLeaderboard(activeCategory);
  const { user } = useSelector((s) => s.auth);
  const leaderboardData = (activeCategory ? catBoard : globalBoard) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-display font-bold text-gradient mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-white/40">The most influential voices on AuraGram</p>
      </div>

      {/* My rank banner */}
      {user && myRank && (
        <div className="card p-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm text-white/50">Your global rank</p>
              <p className="text-xl font-bold text-white">{formatRank(myRank)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50">Aura Score</p>
            <p className="text-xl font-bold text-white">{formatScore(user.auraScore)}</p>
          </div>
          <TierBadge tier={user.tier} size="lg" />
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          id="lb-tab-global"
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            !activeCategory ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-white/50 hover:text-white bg-white/5'
          }`}
        >
          🌐 Global
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`lb-tab-${cat}`}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all capitalize ${
              activeCategory === cat ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-white/50 hover:text-white bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && leaderboardData.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { entry: leaderboardData[1], medal: '🥈', rank: 2 },
            { entry: leaderboardData[0], medal: '🥇', rank: 1 },
            { entry: leaderboardData[2], medal: '🥉', rank: 3 },
          ].map(({ entry, medal, rank }) => (
            <div
              key={entry.userId}
              className={`card p-5 text-center ${rank === 1 ? 'border-yellow-500/30' : ''}`}
              style={rank === 1 ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(168,85,247,0.1))' } : {}}
            >
              <div className="text-3xl mb-2">{medal}</div>
              <div className="font-semibold text-white text-sm truncate">{entry.username}</div>
              <TierBadge tier={entry.tier} size="xs" className="mt-1 mx-auto" />
              <div className="text-white/60 text-sm mt-1">{formatScore(entry.auraScore)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <LeaderboardTable data={leaderboardData} loading={loading} />
    </div>
  );
}

export default Leaderboard;
