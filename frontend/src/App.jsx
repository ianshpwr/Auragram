// src/App.jsx
// Root app with React Router v6, context providers, auth bootstrap

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, clearAuth } from './store/authSlice.js';
import { SocketProvider } from './context/SocketContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import PostPage from './pages/PostPage.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import NotificationPanel from './components/NotificationPanel.jsx';

/**
 * Protected route wrapper — redirects to /login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Guest route wrapper — redirects to / if already authenticated
 */
function GuestRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4 animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, #39ff14, #0cbaba)' }}
        >
          ✦
        </div>
        <p className="text-white/30 text-sm">Loading AuraGram...</p>
      </div>
    </div>
  );
}

// Inner component — lives inside BrowserRouter so useNavigate works
function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Bootstrap: fetch current user on mount
  useEffect(() => {
    dispatch(fetchMe());
  }, []);

  // Listen for forced logout from axios interceptor (no window.location redirect)
  useEffect(() => {
    const handleForceLogout = () => {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [navigate]);

  return (
    <SocketProvider>
      <NotificationProvider>
        <div className="min-h-screen">
          <Navbar />
          <NotificationPanel />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route
              path="/login"
              element={<GuestRoute><Login /></GuestRoute>}
            />
            <Route
              path="/register"
              element={<GuestRoute><Register /></GuestRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </NotificationProvider>
    </SocketProvider>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
