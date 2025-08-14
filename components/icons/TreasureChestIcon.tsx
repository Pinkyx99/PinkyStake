
import React from 'react';

const TreasureChestIcon: React.FC = () => {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="chestBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#854d0e" />
                    <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
                <linearGradient id="chestLid" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a16207" />
                    <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="chestMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
                <filter id="chestGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
            </defs>
            <g filter="url(#chestGlow)" className="animate-treasure-glow">
                {/* Lid */}
                <path d="M15,40 Q50,20 85,40 L85,50 L15,50 Z" fill="url(#chestLid)" />
                {/* Body */}
                <rect x="15" y="50" width="70" height="35" rx="5" fill="url(#chestBody)" />
                {/* Metal Parts */}
                <rect x="10" y="45" width="80" height="10" rx="3" fill="url(#chestMetal)" />
                <rect x="42" y="60" width="16" height="16" rx="2" fill="url(#chestMetal)" />
                 <path d="M45,68 L55,68 L52,73 L48,73 Z" fill="#333" />
            </g>
        </svg>
    );
};

export default TreasureChestIcon;