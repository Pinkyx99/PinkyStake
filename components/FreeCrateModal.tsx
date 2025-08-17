import React, { useState, useEffect, useMemo, useRef } from 'react';

type AnimationStep = 'idle' | 'shaking' | 'opening' | 'revealed';

interface FreeCrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (prize: number) => void;
}

const useAnimatedValue = (endValue: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = easedProgress * endValue;
      setValue(currentValue);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [endValue, duration]);
  
  return value;
};


const FreeCrateModal: React.FC<FreeCrateModalProps> = ({ isOpen, onClose, onClaim }) => {
  const [animationStep, setAnimationStep] = useState<AnimationStep>('idle');
  const [prize, setPrize] = useState<number | null>(null);
  const animatedPrize = useAnimatedValue(prize || 0);

  useEffect(() => {
    if (isOpen) {
      setAnimationStep('idle');
      setPrize(null);
    }
  }, [isOpen]);

  const handleOpenCrate = () => {
    if (animationStep !== 'idle') return;
    const newPrize = parseFloat((Math.random() * 99 + 1).toFixed(2)); // Prize between 1.00 and 100.00
    setPrize(newPrize);
    setAnimationStep('shaking');

    setTimeout(() => {
      setAnimationStep('opening');
      setTimeout(() => {
        setAnimationStep('revealed');
      }, 800); // Duration of lid fly off + light burst
    }, 600); // Duration of shaking
  };
  
  const handleClaimAndClose = () => {
    if (prize !== null) {
      onClaim(prize);
    }
    onClose();
  };
  
  const CONFEtti_COUNT = 50;
  const confetti = useMemo(() => {
    if (animationStep !== 'revealed') return [];
    return Array.from({ length: CONFEtti_COUNT }).map((_, i) => {
        const angle = Math.random() * 360;
        const distance = Math.random() * 150 + 50;
        return {
            id: i,
            style: {
                backgroundColor: ['#facc15', '#4ade80', '#60a5fa', '#f472b6'][Math.floor(Math.random() * 4)],
                '--x-end': `${Math.cos(angle) * distance}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 0.2}s`,
            } as React.CSSProperties,
        };
    });
  }, [animationStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center font-poppins" onClick={onClose}>
      <div className="w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="crate-viewport">
          {animationStep !== 'revealed' && (
            <div className={`crate ${animationStep}`}>
              <div className="crate-lid">
                <div className="crate-band" style={{ top: '10px', left: '-5%', width: '110%', height: '15px' }}></div>
              </div>
              <div className="crate-base">
                 <div className="crate-band" style={{ top: '15px', left: '-5%', width: '110%', height: '20px' }}></div>
                 <div className="crate-band" style={{ bottom: '10px', left: '-5%', width: '110%', height: '20px' }}></div>
              </div>
              <div className="crate-lock"></div>
            </div>
          )}
          {animationStep === 'opening' || animationStep === 'revealed' ? <div className="light-burst"></div> : null}
        </div>
        
        {animationStep === 'revealed' && prize !== null && (
          <div className="prize-display relative">
            <div className="confetti-container">
              {confetti.map(c => <div key={c.id} className="confetti" style={c.style} />)}
            </div>
            <p className="text-xl text-gray-300">You won</p>
            <p className="text-6xl font-bold text-yellow-400 my-2" style={{textShadow: '0 0 15px #fde047'}}>{animatedPrize.toFixed(2)} EUR</p>
            <button onClick={handleClaimAndClose} className="mt-4 px-8 py-3 bg-green-500 text-black font-bold rounded-md hover:bg-green-600 transition-colors">
              Claim Prize
            </button>
          </div>
        )}
        
        {animationStep === 'idle' && (
           <div className="text-center mt-8">
                <button onClick={handleOpenCrate} className="px-8 py-4 bg-purple-600 text-white font-bold rounded-lg text-xl shadow-lg hover:bg-purple-700 transition-colors transform hover:scale-105">
                    Open Crate
                </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default FreeCrateModal;