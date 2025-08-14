import React from 'react';

const ChickenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.3)_0%,rgba(34,197,94,0)_70%)]">
    <img 
      src="https://i.imgur.com/H1MQQN9.png" 
      alt="Chicken" 
      className={`${className} drop-shadow-lg p-1`} 
    />
  </div>
);

export default ChickenIcon;