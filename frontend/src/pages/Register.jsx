// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/authSlice.js';

const CATEGORIES = [
  { id: 'tech', label: 'Tech', icon: '💻', desc: 'Programming, AI, development' },
  { id: 'art', label: 'Art', icon: '🎨', desc: 'Design, creativity, expression' },
  { id: 'science', label: 'Science', icon: '🔬', desc: 'Research, discovery, knowledge' },
  { id: 'gaming', label: 'Gaming', icon: '🎮', desc: 'Games, streams, esports' },
  { id: 'culture', label: 'Culture', icon: '🌍', desc: 'Society, trends, media' },
];

export function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ username: '', email: '', password: '', category: 'tech' });

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (result.type.endsWith('/fulfilled')) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <span className="text-2xl font-black text-white">✦</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">Join AuraGram</h1>
          <p className="text-white/40 mt-2">Build your reputation, earn your tier</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} id="register-form" className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Username</label>
                <input
                  id="register-username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your_username"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Your Category</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    id={`register-category-${cat.id}`}
                    onClick={() => setForm((prev) => ({ ...prev, category: cat.id }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all duration-200 ${
                      form.category === cat.id
                        ? 'border-brand-500/50 bg-brand-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-medium text-white/70">{cat.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-2">
                {CATEGORIES.find((c) => c.id === form.category)?.desc}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : '✦ Create Account'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
