import React from 'react';

const MinesTileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="tileGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#5b21b6" />
        <stop offset="100%" stopColor="#312e81" />
      </radialGradient>
    </defs>
    <rect width="100" height="100" rx="10" fill="url(#tileGradient)" />
    <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="#a78bfa" textAnchor="middle">?</text>
  </svg>
);

export default MinesTileIcon;
