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
            key: Date.now() + i,
            reelItems: generateWeightedReel(winner),
            style: { transform: 'translateX(0px)', transition: 'none' }, 
            winner
        }));
        setSpinResults(newSpinResults);

        setTimeout(() => {
            if (!isMounted.current) return;
            const spinDuration = quickSpin ? 200 : 7000;
            const itemWidth = 144;
            const containerWidth = reelContainerRef.current?.offsetWidth || window.innerWidth;

            setSpinResults(current => current.map(spin => {
                const winnerIndex = 90;
                const finalPosition = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
                return {
                    ...spin,
                    style: {
                        transition: `transform ${spinDuration}ms cubic-bezier(0.2, 0.85, 0.25, 1)`,
                        transform: `translateX(-${finalPosition}px)`
                    }
                };
            }));

            if (!quickSpin) {
                if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
                const startTime = performance.now();
                const playTickingSound = () => {
                    if (!isMounted.current || performance.now() - startTime >= spinDuration) { if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current); return; }
                    playSound('csgo_spinner_tick_v2');
                    const nextInterval = 80 + (420 * ((performance.now() - startTime) / spinDuration));
                    soundTimeoutRef.current = setTimeout(playTickingSound, nextInterval);
                };
                playTickingSound();
            }

            setTimeout(() => {
                if (!isMounted.current) return;
                setIsSpinning(false);
                if (isDemo) { playSound('click'); setSpinResults([]); } 
                else { setMultiWonItems(winners); playSound('win'); }
            }, spinDuration);
        }, 100);
    }, [user, caseCount, currentCase, isSpinning, adjustBalance, playSound, pickWinningItem, quickSpin, generateWeightedReel]);

    const sortedCaseItems = useMemo(() => [...currentCase.items].sort((a,b) => b.price - a.price), [currentCase.items]);
    const totalCost = currentCase.price * caseCount;

    return (
        <div className="csgo-page min-h-screen flex flex-col font-poppins text-white select-none">
            {multiWonItems && <MultiWinCSGOModal items={multiWonItems} onClose={() => { setMultiWonItems(null); setSpinResults([]); }} addToCsgoInventory={addToCsgoInventory} />}
            <div className="csgo-sub-nav sticky top-0 z-20">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'lobby' })}>Mini Games</button>
                        <button className="csgo-sub-nav-item active" onClick={() => setPage({ name: 'csgo-lobby' })}>Cases</button>
                        <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-upgrader' })}>Upgrader</button>
                        <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-battles-lobby' })}>Case Battles</button>
                    </div>
                     {profile && (
                        <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
                            <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                            <span className="text-sm text-gray-400 ml-2">EUR</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="csgo-case-open-v5-main container mx-auto my-8">
                 <div className="flex flex-col md:flex-row items-center gap-8">
                     <img src={currentCase.imageUrl} alt={currentCase.name} className="w-56 h-56 object-contain"/>
                     <div className="flex-grow flex flex-col items-center md:items-start gap-4">
                         <h1 className="text-4xl font-bold">{currentCase.name}</h1>
                         <div className="csgo-count-selector-v2">
                            {[1, 2, 3, 4, 5].map(num => <button key={num} onClick={() => !isSpinning && setCaseCount(num)} className={`csgo-count-selector-v2-btn ${caseCount === num ? 'active' : ''}`}>{num}</button>)}
                         </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                           <button onClick={() => handleSpin(false)} disabled={isSpinning || (user && user.balance < totalCost)} className="csgo-open-button-v5">
                                Open ({caseCount}) For ${totalCost.toFixed(2)}
                            </button>
                            <button onClick={() => handleSpin(true)} disabled={isSpinning} className="px-6 py-3 text-sm font-bold bg-slate-700 hover:bg-slate-600 rounded-md">Demo Spin</button>
                        </div>
                        <label className="csgo-quick-spin-label mt-2">
                            <input type="checkbox" checked={quickSpin} onChange={(e) => setQuickSpin(e.target.checked)} disabled={isSpinning}/>
                            Quick Spin
                        </label>
                     </div>
                 </div>
            </div>
            
            {spinResults.length > 0 && (
                 <div ref={reelContainerRef} className="w-full py-4 space-y-2">
                    {spinResults.map((result) => (
                        <div key={result.key} className="relative w-full overflow-hidden h-40 csgo-spinner-v3 csgo-spinner-marker-v4-container">
                            <div className="csgo-spinner-marker-v4-top"></div>
                            <div className="csgo-spinner-marker-v4-bottom"></div>
                            <div className={`csgo-reel absolute inset-0 flex items-center gap-4 ${isSpinning ? 'is-spinning' : ''}`} style={result.style}>
                                {result.reelItems.map((item, i) => (
                                     <div key={i} className="case-item-card shrink-0 w-36" style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                                        <div className="h-24 flex items-center justify-center p-2">
                                            <img src={item.imageUrl} alt={item.skin} className={`max-w-full max-h-full object-contain rarity-glow-${item.rarity}`}/>
                                        </div>
                                        <div className="mt-auto text-center">
                                            <p className={`text-xs font-bold text-rarity-${item.rarity} truncate`}>{item.skin}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <section className="container mx-auto px-4 py-8">
                 <h2 className="text-2xl font-bold text-center mb-6">Case Contents</h2>
                 <div className="case-contents-grid-v2">
                    {sortedCaseItems.map(item => (
                         <div key={item.id} className="case-item-card-v2" style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                            <div className="absolute top-1 right-1 text-xs font-bold text-gray-400 bg-black/50 px-1.5 py-0.5 rounded">{item.odds.toFixed(2)}%</div>
                            <div className="h-28 flex items-center justify-center p-2">
                                <img src={item.imageUrl} alt={item.skin} className={`max-w-full max-h-full object-contain rarity-glow-${item.rarity}`} />
                            </div>
                            <div className="mt-auto">
                                <p className="text-sm text-gray-300 truncate">{item.weapon}</p>
                                <p className={`text-sm font-bold text-rarity-${item.rarity} truncate`}>{item.skin}</p>
                                <p className="text-sm font-bold text-green-400">${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default CSGOGame;