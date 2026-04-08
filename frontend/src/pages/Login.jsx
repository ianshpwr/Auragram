// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/authSlice.js';

export function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (result.type.endsWith('/fulfilled')) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow shadow-neon"
            style={{ background: 'linear-gradient(135deg, #39ff14, #0cbaba)' }}>
            <span className="text-2xl font-black text-white">✦</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">Welcome back</h1>
          <p className="text-white/40 mt-2">Sign in to your AuraGram account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} id="login-form" className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Join AuraGram
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 card p-4 text-center">
          <p className="text-white/30 text-xs mb-1">Demo credentials (after seeding)</p>
          <p className="text-white/50 text-xs font-mono">apex_nova@auragram.dev / password123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
