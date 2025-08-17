import React from 'react';
import type { BoxItem } from '../../../types';
import { useUser } from '../../../contexts/UserContext';
import { useSound } from '../../../hooks/useSound';

interface WinItemModalProps {
    item: BoxItem;
    onClose: () => void;
}

const WinItemModal: React.FC<WinItemModalProps> = ({ item, onClose }) => {
    const { adjustBalance, addToInventory } = useUser();
    const { playSound } = useSound();

    const handleSell = () => {
        playSound('cashout');
        adjustBalance(item.price);
        onClose();
    };

    const handleKeep = () => {
        playSound('click');
        addToInventory(item);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center font-poppins" onClick={onClose}>
            <div
                className="bg-slate-900/80 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-win-item-modal-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-yellow-400">You Won!</h2>
                <div className="my-6 flex flex-col items-center">
                    <div className="w-48 h-48 p-4 bg-slate-800 rounded-lg flex items-center justify-center">
                        <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="text-xl font-semibold text-white mt-4">{item.name}</p>
                    <p className="text-lg font-bold text-green-400">${item.price.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleKeep}
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                    >
                        Keep Item
                    </button>
                    <button
                        onClick={handleSell}
                        className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors"
                    >
                        Sell for ${item.price.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinItemModal;
