// src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../store/uiSlice.js';
import TierBadge from '../components/TierBadge.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const dispatch = useDispatch();
  const toasts = useSelector((s) => s.ui.toasts);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      {/* Toast Portal */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => dispatch(removeToast(toast.id))} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const isTierChange = toast.type === 'tier_change';

  return (
    <div className={`pointer-events-auto w-80 rounded-2xl overflow-hidden shadow-2xl animate-slide-in
      ${isTierChange ? 'border border-brand-500/50' : 'border border-white/10'}`}
      style={{
        background: isTierChange
          ? 'linear-gradient(135deg, rgba(26,26,38,0.98), rgba(124,58,237,0.2))'
          : 'rgba(26,26,38,0.98)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">{toast.title}</p>
            <p className="text-white/60 text-xs mt-0.5">{toast.message}</p>
          </div>
          {isTierChange && toast.tier && (
            <TierBadge tier={toast.tier} size="sm" />
          )}
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>
        {isTierChange && (
          <div className="mt-3 h-1 rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full animate-[shrink_4s_linear_forwards]"
              style={{ background: 'linear-gradient(90deg, #39ff14, #0cbaba)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export default NotificationContext;
