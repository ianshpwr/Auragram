// src/utils/formatScore.js
// Format aura scores for display

/**
 * Format a score number for compact display.
 * @param {number} score
 * @returns {string}
 */
export function formatScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return n.toLocaleString();
  return n.toString();
}

/**
 * Format a delta value with + or - sign.
 * @param {number} delta
 * @returns {string}
 */
export function formatDelta(delta) {
  if (!delta && delta !== 0) return '—';
  if (delta > 0) return `+${formatScore(delta)}`;
  if (delta < 0) return formatScore(delta);
  return '±0';
}

/**
 * Format a rank number with ordinal suffix.
 * @param {number} rank
 * @returns {string}
 */
export function formatRank(rank) {
  if (!rank) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = rank % 100;
  return rank + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a relative timestamp.
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
