
import React from 'react';

const BrickWallIcon: React.FC = () => {
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="brick" patternUnits="userSpaceOnUse" width="50" height="25">
                    {/* Brick fill */}
                    <rect width="50" height="25" fill="#4b5563" /> 
                    {/* Mortar lines */}
                    <path d="M0 0 H50 M0 12.5 H50 M25 0 V12.5 M0 12.5 V25 M50 12.5 V25" stroke="#1f2937" strokeWidth="2" />
                </pattern>
                 <linearGradient id="wallLighting" x1="0.5" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.25" />
                </linearGradient>
            </defs>
            <rect width="100" height="150" fill="url(#brick)" />
            <rect width="100" height="150" fill="url(#wallLighting)" />
        </svg>
    );
};

export default BrickWallIcon;