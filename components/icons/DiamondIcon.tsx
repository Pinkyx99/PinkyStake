import React from 'react';

const DiamondIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.3)_0%,rgba(56,189,248,0)_70%)] ${className}`}>
     <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1 drop-shadow-lg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#81e6d9', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#38b2ac', stopOpacity: 1}} />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#4fd1c5', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#319795', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <path d="M 50,10 L 90,40 L 50,90 L 10,40 Z" fill="url(#grad1)" />
      <path d="M 50,10 L 10,40 L 50,40 Z" fill="#e6fffa" opacity="0.7" />
      <path d="M 50,10 L 90,40 L 50,40 Z" fill="#b2f5ea" opacity="0.7" />
      <path d="M 10,40 L 50,90 L 50,40 Z" fill="#4fd1c5" opacity="0.7" />
      <path d="M 90,40 L 50,90 L 50,40 Z" fill="#2c7a7b" opacity="0.7" />
      <path d="M 50,10 L 90,40 L 50,90 L 10,40 Z" stroke="#234e4a" strokeWidth="2" fill="none"/>
      <line x1="10" y1="40" x2="90" y2="40" stroke="#319795" strokeWidth="1" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="#319795" strokeWidth="1" />
    </svg>
  </div>
);

export default DiamondIcon;
