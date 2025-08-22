

import React from 'react';
import { type Suit, type Card as CardType } from './deck.ts';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  style?: React.CSSProperties;
}

const getSuitColor = (suit: Suit) => {
  return (suit === '♥' || suit === '♦') ? 'text-red-500' : 'text-gray-800';
};

const CardComponent: React.FC<CardProps> = ({ card, faceDown = false, style }) => {
  if (faceDown) {
    return (
      <div 
        className="relative w-16 h-24 md:w-24 md:h-36 rounded-lg overflow-hidden shadow-lg animate-deal-card bg-gray-900 border-2 border-gray-600 flex items-center justify-center" 
        style={style}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 opacity-50"></div>
        <span 
            className="relative text-4xl md:text-5xl font-bold text-purple-400"
            style={{textShadow: '0 0 15px rgba(192, 132, 252, 0.8)'}}
        >?</span>
      </div>
    );
  }

  const suitColor = getSuitColor(card.suit);

  return (
    <div 
        className={`relative w-16 h-24 md:w-24 md:h-36 bg-gray-100 rounded-lg shadow-xl p-1 md:p-2 flex flex-col justify-between animate-deal-card ${suitColor}`} 
        style={style}
    >
        <div className="text-left">
            <p className="text-xl md:text-2xl font-bold leading-none">{card.rank}</p>
            <p className="text-lg md:text-xl leading-none">{card.suit}</p>
        </div>
        <div className="self-center text-3xl md:text-5xl opacity-80">
            {card.suit}
        </div>
        <div className="text-right transform rotate-180">
            <p className="text-xl md:text-2xl font-bold leading-none">{card.rank}</p>
            <p className="text-lg md:text-xl leading-none">{card.suit}</p>
        </div>
    </div>
  );
};

export default CardComponent;