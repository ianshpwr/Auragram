// src/components/NotificationPanel.jsx
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markAllRead, clearNotifications, closeNotificationPanel } from '../store/uiSlice.js';
import { formatRelativeTime } from '../utils/formatScore.js';

const NOTIFICATION_ICONS = {
  tier_change: '🌟',
  post_liked: '♥',
  post_commented: '💬',
  post_shared: '↗',
  profile_followed: '👤',
  general: '🔔',
};

export function NotificationPanel() {
  const dispatch = useDispatch();
  const { notifications, notificationPanelOpen } = useSelector((s) => s.ui);
  const panelRef = useRef(null);

  useEffect(() => {
    if (notificationPanelOpen) dispatch(markAllRead());
  }, [notificationPanelOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const bellBtn = document.getElementById('notification-bell');
        if (!bellBtn?.contains(e.target)) {
          dispatch(closeNotificationPanel());
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!notificationPanelOpen) return null;

  return (
    <div
      ref={panelRef}
      id="notification-panel"
      className="fixed right-4 top-20 w-80 max-h-[80vh] card overflow-hidden flex flex-col z-50 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="font-semibold text-white text-sm">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(clearNotifications())}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={() => dispatch(closeNotificationPanel())}
            className="text-white/40 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`px-4 py-3 border-b border-white/5 transition-all hover:bg-white/3 ${
                !notif.read ? 'border-l-2 border-l-brand-500' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0 mt-0.5">
                  {NOTIFICATION_ICONS[notif.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{notif.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{notif.message}</p>
                  <p className="text-[10px] text-white/25 mt-1">
                    {formatRelativeTime(notif.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
