// src/utils/tierColors.js
// Tier color mappings for all UI components

export const TIER_COLORS = {
  Dormant: {
    primary: '#6b7280',
    bg: 'rgba(107,114,128,0.15)',
    border: 'rgba(107,114,128,0.3)',
    text: '#9ca3af',
    ring: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
  },
  Spark: {
    primary: '#eab308',
    bg: 'rgba(234,179,8,0.15)',
    border: 'rgba(234,179,8,0.3)',
    text: '#fbbf24',
    ring: '#eab308',
    gradient: 'linear-gradient(135deg, #eab308, #f59e0b)',
  },
  Rising: {
    primary: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.3)',
    text: '#4ade80',
    ring: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
  },
  Resonant: {
    primary: '#14b8a6',
    bg: 'rgba(20,184,166,0.15)',
    border: 'rgba(20,184,166,0.3)',
    text: '#2dd4bf',
    ring: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  },
  Influential: {
    primary: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.3)',
    text: '#60a5fa',
    ring: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  Luminary: {
    primary: '#a855f7',
    bg: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.3)',
    text: '#c084fc',
    ring: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  },
  Apex: {
    primary: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.3)',
    text: '#fbbf24',
    ring: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #a855f7)',
  },
};

export function getTierColors(tier) {
  return TIER_COLORS[tier] || TIER_COLORS.Dormant;
}

export default TIER_COLORS;
