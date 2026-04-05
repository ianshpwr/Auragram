// src/pages/Home.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Feed from '../components/Feed.jsx';
import CreatePost from '../components/CreatePost.jsx';
import ScoreWidget from '../components/ScoreWidget.jsx';

const CATEGORIES = ['All', 'tech', 'art', 'science', 'gaming', 'culture'];

export function Home() {
  const { user } = useSelector((s) => s.auth);
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar — ScoreWidget */}
        {user && (
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <ScoreWidget userId={user._id} />
              <Link
                to="/leaderboard"
                className="card p-4 flex items-center gap-3 hover:border-brand-500/30 transition-all cursor-pointer group block"
              >
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                    Leaderboard
                  </p>
                  <p className="text-xs text-white/40">See global rankings</p>
                </div>
              </Link>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className={`${user ? 'lg:col-span-6' : 'lg:col-span-9'} space-y-5`}>
          {/* Hero for unauthenticated */}
          {!user && (
            <div className="card p-8 text-center mb-8"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))' }}>
              <div className="text-5xl mb-4">✦</div>
              <h1 className="text-3xl font-display font-bold text-gradient mb-2">
                Build Your Aura
              </h1>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                The reputation-driven social platform where your influence is quantified. 
                Post, engage, and climb the tiers.
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/register" className="btn-primary" id="hero-register">Join Free</Link>
                <Link to="/login" className="btn-secondary" id="hero-login">Sign In</Link>
              </div>
            </div>
          )}

          {/* Create post */}
          {user && <CreatePost />}

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`filter-${cat}`}
                onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  (cat === 'All' && !activeCategory) || activeCategory === cat
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70 bg-white/5'
                }`}
                style={(cat === 'All' && !activeCategory) || activeCategory === cat ? {
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Feed */}
          <Feed category={activeCategory} />
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            {/* Tiers guide */}
            <div className="card p-5">
              <h3 className="font-semibold text-white/70 text-sm mb-4">Tier System</h3>
              <div className="space-y-2">
                {[
                  { tier: 'Apex', range: '10,000+', color: '#f59e0b' },
                  { tier: 'Luminary', range: '5,000+', color: '#a855f7' },
                  { tier: 'Influential', range: '2,000+', color: '#3b82f6' },
                  { tier: 'Resonant', range: '800+', color: '#14b8a6' },
                  { tier: 'Rising', range: '250+', color: '#22c55e' },
                  { tier: 'Spark', range: '50+', color: '#eab308' },
                  { tier: 'Dormant', range: '0-49', color: '#6b7280' },
                ].map(({ tier, range, color }) => (
                  <div key={tier} className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color }}>{tier}</span>
                    <span className="text-white/30 text-xs font-mono">{range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;
