import React from 'react';

const MineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="mineGradient" cx="50%" cy="50%" r="50%" fx="65%" fy="35%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#b91c1c" />
      </radialGradient>
      <filter id="mineGlow">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#mineGlow)">
      <circle cx="50" cy="50" r="40" fill="url(#mineGradient)" />
      <circle cx="50" cy="50" r="35" fill="#450a0a" />
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={50 + 40 * Math.cos(i * Math.PI / 4)}
          y2={50 + 40 * Math.sin(i * Math.PI / 4)}
          stroke="#b91c1c"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      <circle cx="50" cy="50" r="10" fill="#f87171" />
    </g>
  </svg>
);

export default MineIcon;
