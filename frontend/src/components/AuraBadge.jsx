// src/components/AuraBadge.jsx
// Animated radial ring badge showing tier and score

import React, { useEffect, useRef } from 'react';
import { getTierColors } from '../utils/tierColors.js';
import { formatScore } from '../utils/formatScore.js';

const SIZE_CONFIG = {
  sm: { outer: 40, stroke: 3, fontSize: 8 },
  md: { outer: 64, stroke: 4, fontSize: 11 },
  lg: { outer: 96, stroke: 5, fontSize: 15 },
};

export function AuraBadge({ score = 0, tier = 'Dormant', size = 'md', className = '', animated = true }) {
  const colors = getTierColors(tier);
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const { outer, stroke, fontSize } = config;
  const inner = outer - stroke * 2;
  const radius = (inner - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Progress: 0-1 based on tier


  const isApex = tier === 'Apex';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: outer, height: outer }}
    >
      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        className={animated ? 'animate-spin-slow' : ''}
        style={{ animationDuration: tier === 'Apex' ? '2s' : tier === 'Luminary' ? '4s' : '8s' }}
      >
        {/* Background ring */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke={isApex ? 'url(#apexGrad)' : colors.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${outer / 2} ${outer / 2})`}
          style={{
            filter: `drop-shadow(0 0 ${stroke + 2}px ${colors.ring})`,
            transition: animated ? 'stroke-dashoffset 1s ease-out' : 'none',
          }}
        />
        {isApex && (
          <defs>
            <linearGradient id="apexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        )}
      </svg>

      {/* Center avatar placeholder */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{
          margin: stroke + 2,
          background: `radial-gradient(circle at center, ${colors.bg}, rgba(17,17,24,0.9))`,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 700,
            fontFamily: 'Outfit, ui-sans-serif',
            background: isApex ? 'linear-gradient(135deg, #f59e0b, #a855f7)' : colors.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          {formatScore(score)}
        </span>
      </div>
    </div>
  );
}

export default AuraBadge;
