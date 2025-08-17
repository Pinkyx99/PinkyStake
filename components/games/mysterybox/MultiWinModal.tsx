
import React, { useState, useMemo, useCallback } from 'react';
import type { BoxItem } from '../../../types';
import { useUser } from '../../../contexts/UserContext';
import { useSound } from '../../../hooks/useSound';
import CloseIcon from '../../icons/CloseIcon';

interface MultiWinItemCardProps {
    item: BoxItem;
    isSelling: boolean;
    onToggle: () => void;
}

const MultiWinItemCard: React.FC<MultiWinItemCardProps> = ({ item, isSelling, onToggle }) => {
    return (
        <div className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${isSelling ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}`}>
            <div className="h-24 flex items-center justify-center mb-2">
                <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
            </div>
            <p className="text-xs text-white truncate font-semibold h-8">{item.name}</p>
            <p className="text-sm font-bold text-yellow-400 mb-2">${item.price.toFixed(2)}</p>
            <button
                onClick={onToggle}
                className={`w-full py-1.5 text-xs font-bold rounded transition-colors ${isSelling ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
                {isSelling ? 'Keep' : 'Sell'}
            </button>
        </div>
    );
};

interface MultiWinModalProps {
    items: BoxItem[];
    onClose: () => void;
}

const MultiWinModal: React.FC<MultiWinModalProps> = ({ items, onClose }) => {
    const { adjustBalance, addToInventory } = useUser();
    const { playSound } = useSound();
    const [sellSelections, setSellSelections] = useState<Record<string, boolean>>({});

    const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);
    
    const { sellValue, keepCount } = useMemo(() => {
        return items.reduce((acc, item, index) => {
            const key = `${item.id}-${index}`;
            if (sellSelections[key]) {
                acc.sellValue += item.price;
            } else {
                acc.keepCount += 1;
            }
            return acc;
        }, { sellValue: 0, keepCount: 0 });
    }, [items, sellSelections]);

    const handleToggle = (id: number, index: number) => {
        const key = `${id}-${index}`;
        setSellSelections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    
    const handleSelectAll = (sell: boolean) => {
        const newSelections: Record<string, boolean> = {};
        if (sell) {
            items.forEach((item, index) => {
                const key = `${item.id}-${index}`;
                newSelections[key] = true;
            });
        }
        setSellSelections(newSelections);
    };

    const handleConfirm = () => {
        let totalSellValue = 0;
        const itemsToKeep: BoxItem[] = [];

        items.forEach((item, index) => {
            const key = `${item.id}-${index}`;
            if (sellSelections[key]) {
                totalSellValue += item.price;
            } else {
                itemsToKeep.push(item);
            }
        });

        if (totalSellValue > 0) {
            playSound('cashout');
            adjustBalance(totalSellValue);
        }
        if (itemsToKeep.length > 0) {
            playSound('click');
            itemsToKeep.forEach(item => {
                addToInventory(item);
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center font-poppins p-2 sm:p-4">
            <div className="bg-slate-900/90 border border-slate-700 w-full max-w-4xl h-[95vh] sm:h-[90vh] rounded-2xl shadow-2xl flex flex-col">
                <header className="p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400">You Won {items.length} Items!</h2>
                        <p className="text-sm text-gray-400">Total Value: ${totalValue.toFixed(2)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><CloseIcon className="w-7 h-7"/></button>
                </header>
                
                <main className="flex-grow overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((item, index) => (
                            <MultiWinItemCard 
                                key={`${item.id}-${index}`} 
                                item={item}
                                isSelling={!!sellSelections[`${item.id}-${index}`]}
                                onToggle={() => handleToggle(item.id, index)}
                            />
                        ))}
                    </div>
                </main>

                <footer className="p-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="text-center sm:text-left">
                        <p className="font-semibold text-lg text-green-400">Keep: {keepCount} Items</p>
                        <p className="font-semibold text-lg text-red-400">Sell Value: ${sellValue.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button onClick={() => handleSelectAll(false)} className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base w-full sm:w-auto">Keep All</button>
                        <button onClick={() => handleSelectAll(true)} className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-sm sm:text-base w-full sm:w-auto">Sell All</button>
                        <button onClick={handleConfirm} className="px-8 py-3 rounded-md bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-sm sm:text-base w-full sm:w-auto">Confirm</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MultiWinModal;
