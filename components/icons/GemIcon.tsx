
import React from 'react';

const GemIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.3)_0%,rgba(56,189,248,0)_70%)]">
    <img 
      src="https://i.imgur.com/4W2d2Nn.png" 
      alt="Gem" 
      className={`${className} drop-shadow-lg p-1`} 
    />
  </div>
);

export default GemIcon;
