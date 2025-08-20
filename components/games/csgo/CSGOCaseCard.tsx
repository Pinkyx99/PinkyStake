import React, { useState, useRef, useCallback } from 'react';
import type { CSGOCase } from '../../../types';
import CoinIcon from '../../icons/CoinIcon';

interface CSGOCaseCardProps {
    box: CSGOCase;
    onSelect: () => void;
}

const CSGOCaseCard: React.FC<CSGOCaseCardProps> = ({ box, onSelect }) => {
    const [activeRisk, setActiveRisk] = useState('L');
    const cardRef = useRef<HTMLDivElement>(null);

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--pointer-x', `${x}px`);
        card.style.setProperty('--pointer-y', `${y}px`);
    }, []);
    
    return (
        <div 
            ref={cardRef}
            onMouseMove={onMouseMove}
            onClick={onSelect} 
            className="csgo-case-card flex flex-col justify-between h-full"
        >
            <div>
                <div className="csgo-case-card-image-wrapper">
                    <img src={box.imageUrl} alt={box.name} className="csgo-case-card-image" />
                </div>
                <h3 className="font-semibold text-gray-200 text-center truncate">{box.name}</h3>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                    <CoinIcon className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold text-gray-200">{box.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-4">
                {['L', 'M', 'H', 'B'].map(risk => (
                     <button key={risk} onClick={(e) => { e.stopPropagation(); setActiveRisk(risk); }} className={`csgo-case-card-risk-btn p-2 rounded text-xs ${activeRisk === risk ? 'active' : ''}`}>
                        {risk}
                        <div className="risk-indicator absolute bottom-0 left-2 right-2 h-0.5 bg-green-400 opacity-0 transform scale-x-0 transition-all duration-300"></div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CSGOCaseCard;