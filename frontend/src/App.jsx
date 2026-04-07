// src/App.jsx
// Root app with React Router v6, context providers, auth bootstrap

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/authSlice.js';
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
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
        >
          ✦
        </div>
        <p className="text-white/30 text-sm">Loading AuraGram...</p>
      </div>
    </div>
  );
}

export function App() {
  const dispatch = useDispatch();
  const { initialized } = useSelector((s) => s.auth);

  // Bootstrap: fetch current user on mount
  useEffect(() => {
    dispatch(fetchMe());
  }, []);

  return (
    <BrowserRouter>
      <SocketProvider>
        <NotificationProvider>
          <div className="min-h-screen">
            <Navbar />
            <NotificationPanel />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile/:id" element={<Profile />} />

              {/* Guest-only routes */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                }
              />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </NotificationProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
