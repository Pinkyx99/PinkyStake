import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Page } from '../../../App.tsx';
import { useUser } from '../../../contexts/UserContext.tsx';
import type { CSGOCase, CSGOItem, CSGOItemRarity } from '../../../types.ts';
import { useSound } from '../../../hooks/useSound.ts';
import CloseIcon from '../../icons/CloseIcon.tsx';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import useAnimatedBalance from '../../../hooks/useAnimatedBalance.tsx';

const RARITY_COLORS: Record<CSGOItemRarity, string> = {
    'Mil-Spec': '#3b82f6', 'Restricted': '#8b5cf6', 'Classified': '#ec4899',
    'Covert': '#ef4444', 'Contraband': '#f97316', 'Extraordinary': '#f59e0b',
    'Consumer': '#d1d5db', 'Industrial': '#60a5fa',
};

const MultiWinCSGOModal: React.FC<{ items: CSGOItem[], onClose: () => void, addToCsgoInventory: (items: CSGOItem[]) => void }> = ({ items, onClose, addToCsgoInventory }) => {
    const { adjustBalance } = useUser();
    const { playSound } = useSound();
    const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

    const handleSellAll = () => {
        playSound('cashout');
        adjustBalance(totalValue);
        onClose();
    };
    
    const handleKeepAll = () => {
        playSound('click');
        addToCsgoInventory(items);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center font-poppins p-4" onClick={onClose}>
            <div
                className="bg-slate-900/90 border border-slate-700 w-full max-w-4xl h-auto max-h-[90vh] rounded-2xl shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-700 text-center">
                    <h2 className="text-2xl font-bold text-yellow-400">You Won {items.length} Item{items.length > 1 ? 's' : ''}!</h2>
                    <p className="text-sm text-gray-400">Total Value: ${totalValue.toFixed(2)}</p>
                    <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </header>
                <main className="flex-grow overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((item, index) => (
                             <div key={`${item.id}-${index}`} className="case-item-card-v2" style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                                <div className="h-24 flex items-center justify-center p-2">
                                    <img src={item.imageUrl} alt={item.skin} className={`max-w-full max-h-full object-contain rarity-glow-${item.rarity}`}/>
                                </div>
                                <div className="mt-auto text-center">
                                    <p className="text-xs text-gray-300 truncate">{item.weapon}</p>
                                    <p className={`text-xs font-bold text-rarity-${item.rarity} truncate`}>{item.skin}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
                <footer className="p-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                    <button onClick={handleKeepAll} className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">Keep All</button>
                    <button onClick={handleSellAll} className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors">Sell All for ${totalValue.toFixed(2)}</button>
                </footer>
            </div>
        </div>
    );
};

type SpinResult = { key: number; reelItems: CSGOItem[]; style: React.CSSProperties; winner: CSGOItem; };

interface CSGOGameProps {
  setPage: (page: Page) => void;
  case: CSGOCase;
  addToCsgoInventory: (items: CSGOItem[]) => void;
}

const CSGOGame: React.FC<CSGOGameProps> = ({ setPage, case: currentCase, addToCsgoInventory }) => {
    const { user, adjustBalance } = useUser();
    const { profile } = useAuth();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const { playSound } = useSound();
    const isMounted = useRef(true);
    const [caseCount, setCaseCount] = useState(1);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinResults, setSpinResults] = useState<SpinResult[]>([]);
    const [multiWonItems, setMultiWonItems] = useState<CSGOItem[] | null>(null);
    const [quickSpin, setQuickSpin] = useState(false);
    const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reelContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

    const pickWinningItem = useCallback((): CSGOItem => {
        let random = Math.random() * 100;
        for (const item of currentCase.items) {
            if (random < item.odds) return item;
            random -= item.odds;
        }
        return currentCase.items[currentCase.items.length - 1];
    }, [currentCase.items]);

    const generateWeightedReel = useCallback((winner: CSGOItem): CSGOItem[] => {
        const reelLength = 100;
        const winnerIndex = 90; // Where the winner will be placed
        const reel: CSGOItem[] = Array(reelLength);

        // Create a weighted pool for random selection
        const weightedPool: CSGOItem[] = [];
        currentCase.items.forEach(item => {
            const weight = Math.round(item.odds * 100); // Create tickets based on odds
            for (let i = 0; i < weight; i++) {
                weightedPool.push(item);
            }
        });

        for (let i = 0; i < reelLength; i++) {
            if (i === winnerIndex) {
                reel[i] = winner;
            } else {
                reel[i] = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            }
        }
        return reel;
    }, [currentCase.items]);
    
    const handleSpin = useCallback(async (isDemo: boolean) => {
        const totalCost = currentCase.price * caseCount;
        if (isSpinning || (!isDemo && (!user || user.balance < totalCost))) return;
        
        if (!isDemo) await adjustBalance(-totalCost);
        
        playSound('bet');
        setIsSpinning(true);
        setMultiWonItems(null);
        
        const winners: CSGOItem[] = Array.from({ length: caseCount }, pickWinningItem);
        const newSpinResults: SpinResult[] = winners.map((winner, i) => ({
            key: Date