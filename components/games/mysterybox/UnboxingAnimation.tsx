import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { BoxItem, MysteryBox } from '../../../types';
import { useSound } from '../../../hooks/useSound.ts';

const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const ItemCard = React.forwardRef<HTMLDivElement, { item: BoxItem }>(({ item }, ref) => (
    <div ref={ref} className="relative shrink-0 w-48 h-56 rounded-lg p-2 bg-slate-800/90 border border-slate-700 transition-all duration-300">
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded">${item.price.toFixed(2)}</div>
        <div className="w-full h-2/3 flex items-center justify-center">
            <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="text-center mt-1">
            <p className="text-sm text-white truncate font-semibold">{item.name}</p>
            <p className="text-xs text-gray-400">{item.brand}</p>
        </div>
    </div>
));


interface UnboxingAnimationProps {
  box: MysteryBox;
  winningItem: BoxItem;
  onAnimationEnd: (item: BoxItem) => void;
}

const UnboxingAnimation: React.FC<UnboxingAnimationProps> = ({ box, winningItem, onAnimationEnd }) => {
    const { playSound } = useSound();
    const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ transition: 'none', transform: 'translateX(0px)', opacity: 0 });
    const reelRef = useRef<HTMLDivElement>(null);
    const firstCardRef = useRef<HTMLDivElement>(null);

    const { reelItems, winnerIndex, baseReelLength } = useMemo(() => {
        const BASE_REEL_LENGTH = 50;
        const allOtherItems = box.items.filter(item => item.id !== winningItem.id);
        
        let baseReel: BoxItem[] = [];
        if (allOtherItems.length > 0) {
            while (baseReel.length < BASE_REEL_LENGTH) {
                baseReel.push(...shuffle(allOtherItems));
            }
        } else {
            baseReel = Array(BASE_REEL_LENGTH).fill(winningItem);
        }
        
        baseReel = baseReel.slice(0, BASE_REEL_LENGTH);
        
        const winnerPosInBase = Math.floor(BASE_REEL_LENGTH * 0.8);
        baseReel[winnerPosInBase] = winningItem;

        const displayReel = [...baseReel, ...baseReel, ...baseReel, ...baseReel]; 
        const finalWinnerIndex = (BASE_REEL_LENGTH * 2) + winnerPosInBase;

        return { reelItems: displayReel, winnerIndex: finalWinnerIndex, baseReelLength: BASE_REEL_LENGTH };
    }, [box.items, winningItem]);

    useEffect(() => {
        let animationFrame: number | null = null;
        let animationEndTimer: ReturnType<typeof setTimeout> | null = null;

        // Use a timeout to ensure the browser has finished its layout pass
        // and all elements have their final dimensions. This is crucial for the first spin.
        const startTimeout = setTimeout(() => {
            const reelElement = reelRef.current;
            const cardElement = firstCardRef.current;
            // Check if component is still mounted
            if (!reelElement || !cardElement) return;

            // Measure actual element dimensions to ensure perfect alignment regardless of rem/px settings
            const computedStyle = getComputedStyle(reelElement);
            const gap = parseFloat(computedStyle.gap);
            const cardWidth = cardElement.offsetWidth;
            const itemWidth = cardWidth + gap;
            const containerWidth = window.innerWidth;
            const animationDuration = 6000;

            // Calculate final position to land dead center on the winning item in the 3rd reel repetition.
            const finalPosition = (winnerIndex * itemWidth) + (cardWidth / 2) - (containerWidth / 2);
            const finalOffset = -finalPosition;
            
            // Calculate start position based on the equivalent item in the 2nd reel repetition for a seamless loop.
            const startWinnerIndex = winnerIndex - baseReelLength;
            const startPosition = (startWinnerIndex * itemWidth) + (cardWidth / 2) - (containerWidth / 2);
            const startOffset = -startPosition;

            // Set initial state without transition
            setStyle({
                transform: `translateX(${startOffset}px)`,
                transition: 'none',
                opacity: 1,
            });

            // Sound effect loop
            const startTime = performance.now();
            const playTickingSound = () => {
                const elapsedTime = performance.now() - startTime;
                if (elapsedTime >= animationDuration) {
                    if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
                    return;
                }
                playSound('spin_tick');
                const progress = elapsedTime / animationDuration;
                const easeOutQuad = (t: number) => t * (2 - t);
                const easedProgress = easeOutQuad(progress);
                const minInterval = 80;
                const maxInterval = 500;
                const nextInterval = minInterval + (maxInterval - minInterval) * easedProgress;
                soundTimeoutRef.current = setTimeout(playTickingSound, nextInterval);
            };
            playTickingSound();

            // On next frame, apply the transition and final state to trigger the animation
            animationFrame = requestAnimationFrame(() => {
                setStyle({
                    transform: `translateX(${finalOffset}px)`,
                    transition: `transform ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                    opacity: 1,
                });
            });

            animationEndTimer = setTimeout(() => {
                onAnimationEnd(winningItem);
            }, animationDuration);

        }, 50); // A small delay is enough for the DOM to settle.

        return () => {
            clearTimeout(startTimeout);
            if (animationEndTimer) clearTimeout(animationEndTimer);
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
        }
    }, [reelItems, winnerIndex, baseReelLength, playSound, onAnimationEnd, winningItem]);

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center font-poppins">
            <div className="w-full relative overflow-hidden h-64">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-red-500/80 z-20 pointer-events-none rounded-full shadow-[0_0_10px_red]"></div>
                <div ref={reelRef} className="absolute top-0 left-0 h-full flex items-center gap-4" style={style}>
                    {reelItems.map((item, index) => (
                        <ItemCard key={`${item.id}-${index}`} item={item} ref={index === 0 ? firstCardRef : null} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UnboxingAnimation;
