import React from 'react';

const BoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.3)_0%,rgba(239,68,68,0)_70%)]">
    <img 
      src="https://i.imgur.com/vwvYkni.png" 
      alt="Bone" 
      className={`${className} drop-shadow-lg p-1`}
    />
  </div>
);

export default BoneIcon;