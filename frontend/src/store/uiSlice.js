// src/store/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    notifications: [],
    toasts: [],
    notificationPanelOpen: false,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
      // Keep max 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.read = true; });
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    addToast: (state, action) => {
      const id = ++toastId;
      state.toasts.push({
        id,
        duration: 4000,
        ...action.payload,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleNotificationPanel: (state) => {
      state.notificationPanelOpen = !state.notificationPanelOpen;
    },
    closeNotificationPanel: (state) => {
      state.notificationPanelOpen = false;
    },
  },
});

export const {
  addNotification,
  markAllRead,
  clearNotifications,
  addToast,
  removeToast,
  toggleNotificationPanel,
  closeNotificationPanel,
} = uiSlice.actions;

export const selectUnreadCount = (state) =>
  state.ui.notifications.filter((n) => !n.read).length;

export default uiSlice.reducer;
