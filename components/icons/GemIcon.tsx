import React from 'react';

const GemIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <filter id="gemGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#gemGlow)">
      <path
        d="M50 5 L95 40 L75 95 L25 95 L5 40 Z"
        fill="url(#gemGradient)"
        stroke="#c4b5fd"
        strokeWidth="2"
      />
      <path d="M50 5 L50 95 M5 40 L95 40 M25 95 L50 40 L75 95" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    </g>
  </svg>
);

export default GemIcon;
