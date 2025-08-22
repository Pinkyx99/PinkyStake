import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useUser } from '../../contexts/UserContext';
import type { CSGOCase, CSGOItem, CSGOItemRarity } from '../../types';
import { useSound } from '../../hooks/useSound';

const RARITY_COLORS: Record<CSGOItemRarity, string> = {
    'Mil-Spec': '#3b82f6',
    'Restricted': '#8b5cf6',
    'Classified': '#ec4899',
    'Covert': '#ef4444',
    'Contraband': '#f97316',
    'Extraordinary': '#f59e0b',
    'Consumer': '#d1d5db',
    'Industrial': '#60a5fa',
};

const MultiWinCSGOModal: React.FC<{ items: CSGOItem[], onClose: () => void }> = ({ items, onClose }) => {
    const { adjustBalance, addToCsgoInventory } = useUser();
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
                className="bg-slate-900/90 border border-slate-700 w-full max-w-4xl h-auto max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-multi-win-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-700 text-center">
                    <h2 className="text-2xl font-bold text-yellow-400">You Won {items.length} Item{items.length > 1 ? 's' : ''}!</h2>
                    <p className="text-sm text-gray-400">Total Value: ${totalValue.toFixed(2)}</p>
                </header>
                <main className="flex-grow overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="csgo-v2-content-card" style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                                 <div className="csgo-v2-content-card-image-wrapper p-4">
                                    <img src={item.imageUrl} alt={item.skin} className={`csgo-v2-content-card-image rarity-glow-${item.rarity}`}/>
                                </div>
                                <div className="text-center mt-auto">
                                    <p className="text-sm text-gray-300 truncate">{item.statTrak && <span className="text-orange-400">StatTrak™ </span>}{item.rarity === 'Extraordinary' && '★ '}{item.weapon}</p>
                                    <p className={`font-bold text-sm text-rarity-${item.rarity} truncate`}>{item.skin}</p>
                                    <p className="font-bold text-sm text-green-400">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="csgo-v2-content-card-rarity-bar"></div>
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

type SpinResult = {
    key: number;
    reelItems: CSGOItem[];
    style: React.CSSProperties;
    winner: CSGOItem;
};

type ViewMode = 'Browsing' | 'Spinning';

const CSGOGame: React.FC<{ onBack: () => void; case: CSGOCase }> = ({ onBack, case: currentCase }) => {
    const { user, adjustBalance } = useUser();
    const animatedBalance = useAnimatedBalance(user?.balance ?? 0);
    const { playSound } = useSound();
    const isMounted = useRef(true);

    const [viewMode, setViewMode] = useState<ViewMode>('Browsing');
    const [caseCount, setCaseCount] = useState(1);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinResults, setSpinResults] = useState<SpinResult[]>([]);
    const [multiWonItems, setMultiWonItems] = useState<CSGOItem[] | null>(null);
    
    const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reelContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const pickWinningItem = useCallback((): CSGOItem => {
        const totalOdds = 100;
        let random = Math.random() * totalOdds;
        for (const item of currentCase.items) {
            if (random < item.odds) { return item; }
            random -= item.odds;
        }
        return currentCase.items[currentCase.items.length - 1];
    }, [currentCase.items]);
    
    const handleSpin = useCallback(async (isDemo: boolean) => {
        const totalCost = currentCase.price * caseCount;
        if (isSpinning || (!isDemo && (!user || user.balance < totalCost))) return;
        
        if (!isDemo) await adjustBalance(-totalCost);
        
        playSound('bet');
        setIsSpinning(true);
        setViewMode('Spinning');
        setMultiWonItems(null);
        
        const winners: CSGOItem[] = [];
        const newSpinResults: SpinResult[] = Array.from({ length: caseCount }).map((_, i) => {
            const winner = pickWinningItem();
            winners.push(winner);
            const reelLength = 100;
            const winnerIndex = reelLength - 10;
            const newReelItems = Array.from({ length: reelLength }, (_, j) => j === winnerIndex ? winner : pickWinningItem());
            return {
                key: Date.now() + i,
                reelItems: newReelItems,
                style: { transform: 'translateX(0px)', transition: 'none' },
                winner: winner
            };
        });
        setSpinResults(newSpinResults);

        setTimeout(() => {
            if (!isMounted.current) return;
            const spinDuration = 7000;
            const itemWidth = 144;
            const containerWidth = reelContainerRef.current?.offsetWidth || window.innerWidth;

            setSpinResults(currentResults => currentResults.map(spin => {
                const winnerIndex = 100 - 10;
                const randomOffset = (Math.random() - 0.5) * (itemWidth * 0.8);
                const finalPosition = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2) + randomOffset;
                return {
                    ...spin,
                    style: {
                        transition: `transform ${spinDuration}ms cubic-bezier(0.2, 0.85, 0.25, 1)`,
                        transform: `translateX(-${finalPosition}px)`
                    }
                };
            }));

            if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
            const startTime = performance.now();
            const playTickingSound = () => {
                const elapsedTime = performance.now() - startTime;
                if (!isMounted.current || elapsedTime >= spinDuration) { if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current); return; }
                playSound('spin_tick');
                const progress = elapsedTime / spinDuration;
                const nextInterval = 80 + (420 * progress);
                soundTimeoutRef.current = setTimeout(playTickingSound, nextInterval);
            };
            playTickingSound();

            setTimeout(() => {
                if (!isMounted.current) return;
                setIsSpinning(false);
                if (isDemo) {
                    playSound('click');
                    setViewMode('Browsing');
                } else {
                    setMultiWonItems(winners);
                    playSound('win');
                }
            }, spinDuration);
        }, 100);
    }, [user, caseCount, currentCase, isSpinning, adjustBalance, playSound, pickWinningItem]);

    const handleModalClose = () => {
        setMultiWonItems(null);
        setViewMode('Browsing');
    };

    const sortedCaseItems = useMemo(() => {
        const itemMap = new Map<string, CSGOItem[]>();
        const singleItems: (CSGOItem & { priceRange?: string })[] = [];

        currentCase.items.forEach(item => {
            if (item.groupId) {
                if (!itemMap.has(item.groupId)) {
                    itemMap.set(item.groupId, []);
                }
                itemMap.get(item.groupId)!.push(item);
            } else {
                singleItems.push(item);
            }
        });

        const consolidatedItems: (CSGOItem & { priceRange?: string })[] = [...singleItems];
        
        itemMap.forEach((variants, groupId) => {
            if (variants.length <= 1) {
                consolidatedItems.push(...variants);
            } else {
                const sortedByPrice = [...variants].sort((a, b) => a.price - b.price);
                const cheapest = sortedByPrice[0];
                const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
                
                consolidatedItems.push({
                    ...cheapest,
                    id: groupId, // Use groupId as a unique key for the consolidated view
                    price: cheapest.price, // Base price for sorting
                    odds: variants.reduce((sum, v) => sum + v.odds, 0),
                    imageUrl: mostExpensive.imageUrl, // Show the most appealing variant
                    priceRange: cheapest.price === mostExpensive.price ? `$${cheapest.price.toFixed(2)}` : `$${cheapest.price.toFixed(2)} - $${mostExpensive.price.toFixed(2)}`
                });
            }
        });
        
        return consolidatedItems.sort((a, b) => b.price - a.price);
    }, [currentCase.items]);
    
    const totalCost = currentCase.price * caseCount;

    return (
        <div className="csgo-v2-page min-h-screen flex flex-col font-poppins select-none overflow-hidden">
            {multiWonItems && <MultiWinCSGOModal items={multiWonItems} onClose={handleModalClose} />}
            <header className="shrink-0 w-full bg-[#1a1b2f] p-3 flex items-center justify-between z-10">
                <div className="flex-1"><button onClick={onBack} aria-label="Back"><ArrowLeftIcon className="w-6 h-6" /></button></div>
                <h1 className="flex-1 text-teal-400 text-xl font-bold uppercase text-center truncate">{currentCase.name}</h1>
                <div className="flex-1 flex justify-end items-center bg-black/30 rounded-md px-4 py-1">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
            </header>
      
            <main className="flex-grow flex flex-col items-center justify-start p-4">
                <div className="csgo-v2-top-container">
                    {viewMode === 'Browsing' ? (
                        <div className="csgo-v2-top-section animate-fade-in">
                            <div className="csgo-v2-case-image-container">
                                <img src={currentCase.imageUrl} alt={currentCase.name} className="csgo-v2-case-image"/>
                            </div>
                            <div className="csgo-v2-controls-container">
                                <h1 className="csgo-v2-case-title">{currentCase.name}</h1>
                                <div className="csgo-v2-count-btns">
                                    {[1, 2, 3, 4, 5].map(num => <button key={num} onClick={() => !isSpinning && setCaseCount(num)} className={`csgo-v2-count-btn ${caseCount === num ? 'active' : ''}`}>{num}</button>)}
                                </div>
                                <div className="csgo-v2-action-btns">
                                    <button onClick={() => handleSpin(false)} disabled={isSpinning || (user && user.balance < totalCost)} className="csgo-v2-open-btn">
                                        Open For ${totalCost.toFixed(2)}
                                    </button>
                                    <button onClick={() => handleSpin(true)} disabled={isSpinning} className="csgo-v2-demo-btn">Demo</button>
                                </div>
                                <a href="#" className="csgo-v2-provably-fair">Provably Fair</a>
                            </div>
                        </div>
                    ) : (
                         <div ref={reelContainerRef} className="csgo-multi-spinner-container animate-fade-in">
                            <div className="csgo-multi-spinner-marker"></div>
                            <div className="csgo-reels-column">
                                {spinResults.map(spin => (
                                    <div key={spin.key} className="csgo-reel-wrapper">
                                        <div className="csgo-reel" style={spin.style}>
                                            {spin.reelItems.map((item, index) => (
                                                <div key={index} className="csgo-reel-item">
                                                    <div className="csgo-reel-item-inner" style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                                                        <img src={item.imageUrl} alt={item.skin} className="csgo-reel-item-image"/>
                                                        <p className="csgo-reel-item-name">{item.rarity === 'Extraordinary' ? `★ ${item.weapon}` : item.weapon}</p>
                                                        <p className={`csgo-reel-item-skin text-rarity-${item.rarity}`}>{item.skin}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full max-w-6xl">
                    <h2 className="text-2xl font-bold text-center mb-4">Case Contents</h2>
                    <div className="csgo-v2-contents-grid">
                        {sortedCaseItems.map(item => (
                             <div key={item.id} className="csgo-v2-content-card" style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                                <div className="csgo-v2-item-header">
                                    <span className="csgo-v2-item-price">
                                        {(item as any).priceRange ? (item as any).priceRange : `$${item.price.toFixed(2)}`}
                                    </span>
                                    <span className="csgo-v2-item-odds">{item.odds.toFixed(4)}%</span>
                                </div>
                                <div className="csgo-v2-content-card-image-wrapper">
                                    <img src={item.imageUrl} alt={item.skin} className={`csgo-v2-content-card-image rarity-glow-${item.rarity}`}/>
                                </div>
                                <div className="text-center mt-auto">
                                    <p className="text-sm text-gray-300 truncate">{item.statTrak && <span className="text-orange-400">StatTrak™ </span>}{item.rarity === 'Extraordinary' && '★ '}{item.weapon}</p>
                                    <p className={`font-bold text-sm text-rarity-${item.rarity} truncate`}>{item.skin}</p>
                                </div>
                                <div className="csgo-v2-content-card-rarity-bar"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CSGOGame;