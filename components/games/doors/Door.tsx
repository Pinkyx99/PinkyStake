

import React from 'react';
import BrickWallIcon from '../../icons/BrickWallIcon';
import TreasureChestIcon from '../../icons/TreasureChestIcon';

interface DoorComponentProps {
  isSafe: boolean;
  onClick: () => void;
  isClickable: boolean;
  isRevealed: boolean;
  animationState: 'swing' | 'thud' | null;
  isFaded: boolean;
}

const DoorComponent = React.forwardRef<HTMLDivElement, DoorComponentProps>(({ isSafe, onClick, isClickable, isRevealed, animationState, isFaded }, ref) => {
  const getAnimationClass = () => {
    if (animationState === 'swing') return 'animate-swing';
    if (animationState === 'thud') return 'animate-thud';
    return '';
  };

  if (isRevealed && !animationState) {
    // Keep revealed doors visible but static after the round ends
    return (
       <div className="door-container opacity-50">
           {isSafe && <div className="portal-glow-effect" />}
            <div className="door-leaf" style={{transform: `rotateY(${isSafe ? -160 : 0}deg)`}}>
                 <div className="door-front-face bg-[#4a3f70] border-2 border-[#2a2341] p-2 shadow-lg overflow-hidden">
                    <div className="relative w-full h-full rounded-md bg-gradient-to-b from-[#3a3153] to-[#2c2541] flex items-center justify-center">
                        {/* Frame */}
                        <div className="absolute inset-0 border-8 border-[#2c2541] rounded-md"></div>
                        <div className="absolute inset-1 border-4 border-amber-800 rounded-sm"></div>
                        <div className="absolute inset-2 border border-amber-500 rounded-sm"></div>

                        {/* Knocker */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-amber-800"></div>
                            <div className="w-12 h-8 -mt-2 border-4 border-amber-500 rounded-b-full"></div>
                        </div>
                    </div>
                 </div>
                 <div className={`door-back-face ${isSafe ? 'bg-green-900/20' : 'bg-transparent'}`}>
                    {isSafe && <TreasureChestIcon />}
                 </div>
            </div>
            {!isSafe && <div className="door-wall-behind"><BrickWallIcon /></div>}
       </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`door-container ${isFaded ? 'faded-out' : ''} ${isClickable && !animationState ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={isClickable && !animationState ? onClick : undefined}
      aria-hidden={!isClickable || !!animationState}
    >
      {isSafe && animationState === 'swing' && <div className="portal-glow-effect" />}
      <div className={`door-leaf ${getAnimationClass()}`}>
        {/* Front of the door */}
        <div className="door-front-face bg-[#4a3f70] border-2 border-[#2a2341] p-2 shadow-lg overflow-hidden">
            <div className="relative w-full h-full rounded-md bg-gradient-to-b from-[#3a3153] to-[#2c2541] flex items-center justify-center">
                {/* Frame */}
                <div className="absolute inset-0 border-8 border-[#2c2541] rounded-md"></div>
                <div className="absolute inset-1 border-4 border-amber-800 rounded-sm"></div>
                <div className="absolute inset-2 border border-amber-500 rounded-sm"></div>

                {/* Knocker */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-amber-800"></div>
                    <div className="w-12 h-8 -mt-2 border-4 border-amber-500 rounded-b-full"></div>
                </div>
            </div>
        </div>

        {/* Back of the door (only used for safe reveal) */}
        <div className={`door-back-face ${isSafe ? 'bg-green-900/20' : 'bg-transparent'}`}>
          {isSafe && <TreasureChestIcon />}
        </div>
      </div>
      
      {/* Wall behind the door (only rendered for locked doors during animation to prevent cheating) */}
      {!isSafe && (animationState === 'thud' || isRevealed) && (
        <div className="door-wall-behind">
            <BrickWallIcon />
        </div>
      )}
    </div>
  );
});

export default DoorComponent;