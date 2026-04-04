// src/components/TierBadge.jsx
import React from 'react';
import { getTierColors } from '../utils/tierColors.js';

const TIER_ICONS = {
  Dormant: '○',
  Spark: '⚡',
  Rising: '↑',
  Resonant: '◉',
  Influential: '◆',
  Luminary: '★',
  Apex: '♦',
};

export function TierBadge({ tier = 'Dormant', size = 'md', showIcon = true, className = '' }) {
  const colors = getTierColors(tier);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`tier-badge ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      {showIcon && <span>{TIER_ICONS[tier]}</span>}
      {tier}
    </span>
  );
}

export default TierBadge;
