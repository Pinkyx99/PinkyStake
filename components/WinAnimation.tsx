

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import useAnimatedBalance from '../hooks/useAnimatedBalance';

interface WinAnimationProps {
  amount: number;
  onComplete: () => void;
}

const CONFEtti_COUNT = 50;

const WinAnimation: React.FC<WinAnimationProps> = ({ amount, onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const animatedAmount = useAnimatedBalance(amount > 0 ? amount : 0, 800);
  
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (isExiting) return;

    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);

    setIsExiting(true);
    completeTimerRef.current = setTimeout(() => onCompleteRef.current(), 800);
  }, [isExiting]);

  useEffect(() => {
    exitTimerRef.current = setTimeout(handleClose, 2000);

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [handleClose]);

  const confetti = useMemo(() => {
    return Array.from({ length: CONFEtti_COUNT }).map((_, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 120 + 40;
        const xEnd = Math.cos(angle) * distance;
        const yEnd = Math.sin(angle) * distance;
        return {
            id: i,
            style: {
                backgroundColor: ['#facc15', '#4ade80', '#60a5fa', '#f472b6'][Math.floor(Math.random() * 4)],
                '--x-end': `${xEnd}px`,
                '--y-end': `${yEnd}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 0.2}s`,
            } as React.CSSProperties,
        };
    });
  }, []);

  return (
    <div 
      className={`win-animation-container fixed inset-0 bg-black/60 flex items-center justify-center z-[100] ${isExiting ? 'exiting pointer-events-none' : ''} cursor-pointer`} 
      role="alert" 
      aria-live="assertive"
      onClick={handleClose}
    >
      <div className="win-animation-content text-center relative">
        {confetti.map(c => <div key={c.id} className="confetti" style={c.style} />)}
        <p className="text-3xl font-bold text-white drop-shadow-lg">You Won!</p>
        <p className="text-6xl font-black text-yellow-400 drop-shadow-lg" style={{textShadow: '0 0 15px rgba(250, 204, 21, 0.7)'}}>
          +{animatedAmount.toFixed(2)}
        </p>
        <p className="text-2xl font-bold text-gray-300 drop-shadow-lg">EUR</p>
      </div>
    </div>
  );
};

export default WinAnimation;