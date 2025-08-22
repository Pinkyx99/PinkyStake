import React, { useRef, useCallback } from 'react';
import { type Game } from '../types.ts';

const GameCard: React.FC<{ game: Game; onSelect: () => void; }> = ({ game, onSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = card.offsetWidth / 2;
    const centerY = card.offsetHeight / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    const imageX = (centerX - x) / 20;
    const imageY = (y - centerY) / 20;

    card.style.setProperty('--rotate-x', `${-rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
    
    card.style.setProperty('--pointer-x', `${x}px`);
    card.style.setProperty('--pointer-y', `${y}px`);
    
    card.style.setProperty('--image-x', `${imageX}px`);
    card.style.setProperty('--image-y', `${imageY}px`);
  }, []);

  const onMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.add('is-active');
    card.style.setProperty('--scale', '1.05');
    card.style.setProperty('--shine-opacity', '1');
  }, []);

  const onMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.remove('is-active');
    card.style.setProperty('--scale', '1');
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
    card.style.setProperty('--shine-opacity', '0');
    card.style.setProperty('--image-x', '0px');
    card.style.setProperty('--image-y', '0px');
  }, []);

  return (
    <div
      className="cursor-pointer"
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSelect}
      style={{ perspective: '1500px' }}
      aria-label={`Play ${game.title || 'game'}`}
    >
      <div
        ref={cardRef}
        className="interactive-card relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-500/40"
      >
        <div className="absolute inset-0 w-full h-full card-image-wrapper">
           <img
            src={game.imageUrl}
            alt={game.title || 'Game image'}
            className="absolute inset-0 w-full h-full object-cover"
            width="300"
            height="375"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
        <div className="card-shine z-20" />
        <div className="absolute inset-0 rounded-2xl z-10" style={{ boxShadow: 'inset 0px 0px 0px 2px rgba(255,255,255,0.08)' }}></div>
      </div>
    </div>
  );
};

export default GameCard;