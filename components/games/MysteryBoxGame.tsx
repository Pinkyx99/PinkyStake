
import React, { useState, useCallback, useMemo } from 'react';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useUser } from '../../contexts/UserContext';
import type { BoxItem, MysteryBox } from '../../types';
import UnboxingAnimation from './mysterybox/UnboxingAnimation';
import { useSound } from '../../hooks/useSound';
import MinusIcon from '../icons/MinusIcon';
import PlusIcon from '../icons/PlusIcon';
import CloseIcon from '../icons/CloseIcon';

const ItemCard: React.FC<{ item: BoxItem }> = ({ item }) => {
    return (
        <div className="mystery-item-card">
            <p className="mystery-item-odds">{item.odds.toFixed(4)}%</p>
            <p className="mystery-item-name">{item.name}</p>
            <div className="mystery-item-image-wrapper">
                <img src={item.imageUrl} alt={item.name} className="mystery-item-image"/>
            </div>
            <div className="mystery-item-price-button">${item.price.toFixed(2)}</div>
        </div>
    );
};

// --- Start of inlined WinItemModal ---
const WinItemModal: React.FC<{ item: BoxItem; onClose: () => void; }> = ({ item, onClose }) => {
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
// --- End of inlined WinItemModal ---


// --- Start of inlined MultiWinModal ---
const MultiWinItemCard: React.FC<{ item: BoxItem; isSelling: boolean; onToggle: () => void; }> = ({ item, isSelling, onToggle }) => {
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

const MultiWinModal: React.FC<{ items: BoxItem[]; onClose: () => void; }> = ({ items, onClose }) => {
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
// --- End of inlined MultiWinModal ---


const MysteryBoxGame: React.FC<{ onBack: () => void; box: MysteryBox }> = ({ onBack, box }) => {
    const { profile, adjustBalance } = useUser();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const [isUnboxing, setIsUnboxing] = useState(false);
    const [winningItem, setWinningItem] = useState<BoxItem | null>(null);
    const [showWinModal, setShowWinModal] = useState(false);
    const [boxCount, setBoxCount] = useState(1);
    const [winningItems, setWinningItems] = useState<BoxItem[] | null>(null);
    const [showMultiWinModal, setShowMultiWinModal] = useState(false);
    const { playSound } = useSound();

    const handleUnbox = useCallback(async () => {
        const totalCost = box.price * boxCount;
        if (!profile || profile.balance < totalCost) {
            alert("Not enough balance to open this box.");
            return;
        }

        playSound('bet');
        await adjustBalance(-totalCost);

        if (boxCount === 1) {
            const totalOdds = 100;
            let random = Math.random() * totalOdds;
            let winner: BoxItem = box.items[box.items.length - 1]; // Fallback to last item
            for (const item of box.items) {
                if (random < item.odds) {
                    winner = item;
                    break;
                }
                random -= item.odds;
            }
            setWinningItem(winner);
            setIsUnboxing(true);
        } else {
            const winners: BoxItem[] = [];
            for (let i = 0; i < boxCount; i++) {
                const totalOdds = 100;
                let random = Math.random() * totalOdds;
                let winner: BoxItem = box.items[box.items.length - 1]; // Fallback
                for (const item of box.items) {
                    if (random < item.odds) {
                        winner = item;
                        break;
                    }
                    random -= item.odds;
                }
                winners.push(winner);
            }
            setWinningItems(winners);
            setShowMultiWinModal(true);
        }
    }, [profile, adjustBalance, playSound, box, boxCount]);

    const handleAnimationEnd = useCallback((item: BoxItem) => {
        setIsUnboxing(false);
        setWinningItem(item);
        setShowWinModal(true);
    }, []);

    const handleWinModalClose = () => {
        setShowWinModal(false);
        setWinningItem(null);
    };

    const handleMultiWinModalClose = () => {
        setShowMultiWinModal(false);
        setWinningItems(null);
    };

    const handleCountChange = (amount: number) => {
        setBoxCount(prev => {
            const newCount = prev + amount;
            if (newCount < 1) return 1;
            if (newCount > 5) return 5;
            return newCount;
        });
    };
    
    const totalCost = box.price * boxCount;

    return (
        <div className="mystery-box-page">
            {isUnboxing && winningItem && (
                <UnboxingAnimation box={box} winningItem={winningItem} onAnimationEnd={handleAnimationEnd} />
            )}
            
            {showWinModal && winningItem && (
                <WinItemModal item={winningItem} onClose={handleWinModalClose} />
            )}
            
            {showMultiWinModal && winningItems && (
                <MultiWinModal items={winningItems} onClose={handleMultiWinModalClose} />
            )}


            <header className="shrink-0 w-full bg-transparent p-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full bg-black/20 hover:bg-black/40">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center p-4">
                <div className="mystery-box-hero h-[350px] md:h-[400px]">
                    <div className="mystery-box-bg-particles"></div>
                    <div className="text-center z-10">
                        <h1 className="text-3xl md:text-5xl font-bold">{box.name} <span className="text-red-500">${box.price.toFixed(2)}</span></h1>
                        <p className="text-gray-400">An official box by PinkyStake</p>
                    </div>
                    <img src={box.imageUrl} alt={box.name} className="mystery-box-image w-[150px] h-[150px] md:w-[200px] md:h-[200px]"/>
                    <div className="mystery-box-actions flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                        <div className="flex items-center bg-black/30 rounded-full h-14 sm:h-16">
                            <button onClick={() => handleCountChange(-1)} className="px-4 h-full text-white/50 hover:text-white"><MinusIcon className="w-6 h-6"/></button>
                            <span className="text-xl sm:text-2xl font-bold w-12 text-center">{boxCount}</span>
                            <button onClick={() => handleCountChange(1)} className="px-4 h-full text-white/50 hover:text-white"><PlusIcon className="w-6 h-6"/></button>
                        </div>
                        <button onClick={handleUnbox} className="mystery-box-spin-button animate-spin-button-glow px-6 sm:px-12 py-3 text-base sm:text-lg h-14 sm:h-16">
                           SPIN ({boxCount}) FOR ${totalCost.toFixed(2)}
                        </button>
                    </div>
                </div>
                
                <div className="mystery-box-divider">
                    <span>ITEMS IN THIS BOX</span>
                </div>

                <div className="w-full max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...box.items].sort((a,b) => b.price - a.price).map(item => (
                           <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default MysteryBoxGame;
