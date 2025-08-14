import React from 'react';

const BombIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.3)_0%,rgba(239,68,68,0)_70%)] ${className}`}>
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1 drop-shadow-lg">
      <g>
        <path d="M49.5 45.1C53.2 40.5 55 34.5 55 29C55 16.3 45.7 7 33 7C20.3 7 11 16.3 11 29C11 35.5 13.5 41.5 17.5 46.1" stroke="#FBBF24" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 4.2C30 5.8 28.7 7.1 27 7.1C25.3 7.1 24 5.8 24 4.2C24 2.6 25.3 1.3 27 1.3C28.7 1.3 30 2.6 30 4.2Z" fill="#F59E0B"/>
        <path d="M27 7L29 11L33 13L35 17" stroke="#9A3412" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M29 53.6C37.5 53.6 44.4 48.7 48.1 42.2C49.9 39.2 51.1 35.7 51.5 32" stroke="#4B5563" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="32" cy="41" r="22" fill="#27272A"/>
        <circle cx="32" cy="41" r="22" stroke="#18181B" strokeWidth="2"/>
        <path d="M38 35C39.2376 35 40.25 33.9876 40.25 32.75C40.25 31.5124 39.2376 30.5 38 30.5C36.7624 30.5 35.75 31.5124 35.75 32.75C35.75 33.9876 36.7624 35 38 35Z" fill="#F1F5F9"/>
      </g>
    </svg>
  </div>
);

export default BombIcon;
