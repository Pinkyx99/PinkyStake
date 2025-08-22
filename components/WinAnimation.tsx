import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import useAnimatedBalance from '../hooks/useAnimatedBalance.tsx';

interface WinAnimationProps {
  amount: number;
  onComplete: () => void;
}

const CONFETTI_COUNT = 70; // More confetti!

const WinAnimation: React.FC<WinAnimationProps> = ({ amount, onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const animatedAmount = useAnimatedBalance(amount > 0 ? amount : 0, 800);
  
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => onCompleteRef.current(), 500); // Match CSS exit animation duration
  }, [isExiting]);

  useEffect(() => {
    const exitTimer = setTimeout(handleClose, 3000); // Auto-close after 3 seconds
    return () => clearTimeout(exitTimer);
  }, [handleClose]);

  const confetti = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 200 + 80; // Make explosion bigger
        const xEnd = Math.cos(angle) * distance;
        const yEnd = Math.sin(angle) * distance;
        return {
            id: i,
            style: {
                backgroundColor: ['#facc15', '#4ade80', '#60a5fa', '#f472b6'][Math.floor(Math.random() * 4)],
                '--x-end': `${xEnd}px`,
                '--y-end': `${yEnd}px`,
                animationDelay: `${Math.random() * 0.2}s`,
            } as React.CSSProperties,
        };
    });
  }, []);

  return (
    <div 
      className={`win-animation-container ${isExiting ? 'exiting' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        <div className="confetti-container">
          {!isExiting && confetti.map(c => <div key={c.id} className="confetti" style={c.style} />)}
        </div>
        <div className="win-animation-content">
          <p className="win-animation-title">YOU WON</p>
          <p className="win-animation-amount">
            {animatedAmount.toFixed(2)}
            <span className="text-3xl ml-2 opacity-80">EUR</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WinAnimation;