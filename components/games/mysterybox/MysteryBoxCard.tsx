
import React from 'react';
import type { MysteryBox } from '../../../types';

interface MysteryBoxCardProps {
    box: MysteryBox;
    onSelect: () => void;
}

const MysteryBoxCard: React.FC<MysteryBoxCardProps> = ({ box, onSelect }) => {
    return (
        <div 
            onClick={onSelect}
            className="group relative flex flex-col justify-end text-center bg-slate-900/50 border border-slate-700 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-purple-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden"
        >
            <img src={box.imageUrl} alt={box.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-30 group-hover:opacity-40" />
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-32 h-32 mb-4 flex items-center justify-center">
                    <img src={box.imageUrl} alt={box.name} className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="font-bold text-lg text-white">{box.name}</h3>
                <p className="font-semibold text-yellow-400 bg-black/40 px-3 py-1 rounded-full mt-2">${box.price.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default MysteryBoxCard;
