import React from 'react';

const GemTileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="tileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
             <linearGradient id="gemOutlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" rx="12" fill="url(#tileGradient)" />
        <rect x="2" y="2" width="96" height="96" rx="10" fill="none" stroke="#64748b" strokeWidth="2" />
        {/* Gem outline in the middle */}
        <path d="M 50,25 L 75,45 L 50,75 L 25,45 Z" stroke="url(#gemOutlineGradient)" strokeWidth="4" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.6"/>
        <path d="M 25,45 L 75,45" stroke="url(#gemOutlineGradient)" strokeWidth="3" fill="none" strokeLinejoin="round" opacity="0.4"/>
    </svg>
);

export default GemTileIcon;
