import React, { useState, useCallback } from 'react';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useUser } from '../../contexts/UserContext';
import type { BoxItem, MysteryBox } from '../../types';
import UnboxingAnimation from './mysterybox/UnboxingAnimation';
import WinItemModal from './mysterybox/WinItemModal';
import MultiWinModal from './mysterybox/MultiWinModal';
import { useSound } from '../../hooks/useSound';
import MinusIcon from '../icons/MinusIcon';
import PlusIcon from '../icons/PlusIcon';

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