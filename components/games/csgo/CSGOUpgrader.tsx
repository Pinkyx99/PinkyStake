
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ArrowLeftIcon from '../../icons/ArrowLeftIcon';
import { useUser } from '../../../contexts/UserContext';
import { allCSGOCases } from './data';
import type { CSGOItem, CSGOInventoryItem, CSGOItemRarity } from '../../../types';
import CheckIcon from '../../icons/CheckIcon';

const RARITY_COLORS: Record<CSGOItemRarity, string> = {
    'Mil-Spec': '#3b82f6', 'Restricted': '#8b5cf6', 'Classified': '#ec4899',
    'Covert': '#ef4444', 'Contraband': '#f97316', 'Extraordinary': '#f59e0b',
    'Consumer': '#d1d5db', 'Industrial': '#60a5fa',
};

const MULTIPLIERS = [1.5, 2, 5, 10, 20];

const getChanceLabel = (chance: number): string => {
    if (chance >= 95) return "Guaranteed";
    if (chance > 80) return "Very High";
    if (chance > 60) return "High";
    if (chance > 40) return "Medium";
    if (chance > 20) return "Low";
    return "Very Low";
};

const SkinCard: React.FC<{
    item: CSGOItem | CSGOInventoryItem;
    onSelect: () => void;
    isSelected: boolean;
    isDisabled?: boolean;
}> = ({ item, onSelect, isSelected, isDisabled }) => (
    <div
        onClick={isDisabled ? undefined : onSelect}
        className={`skin-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ '--rarity-color': RARITY_COLORS[item.rarity] } as React.CSSProperties}
    >
        {isSelected && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500/80 rounded-full flex items-center justify-center z-10">
                <CheckIcon className="w-8 h-8 text-white" />
            </div>
        )}
        <div className="skin-card-image-container">
            <img src={item.imageUrl} alt={item.skin} className={`rarity-glow-${item.rarity} ${isSelected ? 'opacity-30' : ''}`} />
        </div>
        <div className="skin-card-info mt-auto">
            <p className="text-xs font-semibold truncate text-gray-200">{item.weapon}</p>
            <p className={`text-xs font-bold truncate text-rarity-${item.rarity}`}>{item.skin}</p>
            <p className="skin-card-price">${item.price.toFixed(2)}</p>
        </div>
    </div>
);

const CSGOUpgrader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, addItemsToCsgoInventory, removeFromCsgoInventory, adjustBalance } = useUser();
    
    const allSkins = useMemo(() => {
        const skinMap = new Map<string, CSGOItem>();
        allCSGOCases.flatMap(c => c.items).forEach(item => {
            if (!skinMap.has(item.id) && item.price > 0) {
                skinMap.set(item.id, item);
            }
        });
        return Array.from(skinMap.values()).sort((a, b) => a.price - b.price);
    }, []);
    
    const [userInventory, setUserInventory] = useState<CSGOInventoryItem[]>(profile.csgoInventory);

    useEffect(() => {
        setUserInventory(profile.csgoInventory);
    }, [profile.csgoInventory]);

    const [userItems, setUserItems] = useState<CSGOInventoryItem[]>([]);
    const [targetItem, setTargetItem] = useState<CSGOItem | null>(null);
    const [wonItem, setWonItem] = useState<CSGOInventoryItem | null>(null);
    const [gameState, setGameState] = useState<'idle' | 'upgrading' | 'success' | 'failure'>('idle');
    const [gaugeRotation, setGaugeRotation] = useState(0);
    const [activeMultiplier, setActiveMultiplier] = useState<number | null>(null);

    const totalUserValue = useMemo(() => userItems.reduce((sum, item) => sum + item.price, 0), [userItems]);

    useEffect(() => {
        setTargetItem(null);
    }, [userItems, activeMultiplier]);

    const { chance } = useMemo(() => {
        if (userItems.length === 0 || !targetItem) return { chance: 0 };
        const userValue = totalUserValue;
        if (targetItem.price <= userValue) return { chance: 95 };
        const calculatedChance = (userValue / targetItem.price) * 95;
        return { chance: Math.min(95, calculatedChance) };
    }, [userItems, targetItem, totalUserValue]);
    
    const handleUserItemSelect = (item: CSGOInventoryItem) => {
        if (gameState !== 'idle') return;
        setUserItems(prev => {
            const isSelected = prev.some(i => i.instanceId === item.instanceId);
            if (isSelected) {
                return prev.filter(i => i.instanceId !== item.instanceId);
            } else {
                if (prev.length < 9) { // Limit selection to 9 items
                   return [...prev, item];
                }
                return prev;
            }
        });
    };
    
    const resetGame = useCallback(() => {
        setUserItems([]);
        setTargetItem(null);
        setWonItem(null);
        setGameState('idle');
        setActiveMultiplier(null);
    }, []);

    const handleUpgrade = () => {
        if (gameState !== 'idle' || userItems.length === 0 || !targetItem) return;

        setGameState('upgrading');
        const instanceIdsToRemove = userItems.map(item => item.instanceId);
        removeFromCsgoInventory(instanceIdsToRemove);
        
        // 1. Determine the outcome FIRST. This is the source of truth.
        const isWin = Math.random() * 100 < chance;
        
        // 2. Calculate the target angle for the animation based on the outcome.
        const winArcDegrees = (chance / 100) * 360;
        let targetAngleInDegrees;

        if (isWin) {
            // Land somewhere randomly within the green "win" arc.
            const padding = 5; // degrees to prevent landing on the very edge
            const minAngle = padding;
            const maxAngle = winArcDegrees - padding;
            targetAngleInDegrees = maxAngle > minAngle
                ? Math.random() * (maxAngle - minAngle) + minAngle
                : winArcDegrees / 2; // Default to middle if arc is too small
        } else {
            // Land somewhere randomly within the gray "loss" arc.
            const padding = 5; // degrees
            const lossArcDegrees = 360 - winArcDegrees;
            const minAngle = winArcDegrees + padding;
            const maxAngle = 360 - padding;
             targetAngleInDegrees = maxAngle > minAngle
                ? Math.random() * (maxAngle - minAngle) + minAngle
                : winArcDegrees + lossArcDegrees / 2; // Default to middle
        }
        
        // 3. Calculate the final rotation for a smooth animation.
        const fullSpins = (5 + Math.floor(Math.random() * 2)) * 360;
        // This ensures the spinner always moves forward and completes full rotations before settling.
        const finalRotation = Math.floor(gaugeRotation / 360) * 360 + fullSpins + targetAngleInDegrees;

        setGaugeRotation(finalRotation);

        // 4. Update game state after the animation completes.
        setTimeout(() => {
            if (isWin) {
                const newItemInstance: CSGOInventoryItem = { ...targetItem, instanceId: `new-${Date.now()}` };
                addItemsToCsgoInventory([targetItem]);
                setWonItem(newItemInstance);
                setGameState('success');
            } else {
                setGameState('failure');
            }
            setUserItems([]);
            setTargetItem(null);
            setActiveMultiplier(null);
        }, 6100); // Match CSS transition duration + 100ms buffer
    };

    const handleSell = () => {
        if (gameState !== 'success' || !wonItem) return;
        adjustBalance(wonItem.price);
        removeFromCsgoInventory([wonItem.instanceId]);
        resetGame();
    };

    const handleKeep = () => {
        if (gameState !== 'success') return;
        // Item is already in inventory, just reset the UI
        resetGame();
    };


    const targetableSkins = useMemo(() => {
        if (userItems.length === 0) return allSkins;
        const userValue = totalUserValue;
        if (activeMultiplier) {
            const targetPrice = userValue * activeMultiplier;
            const lowerBound = targetPrice * 0.9;
            const upperBound = targetPrice * 1.2;
            return allSkins.filter(skin => skin.price > lowerBound && skin.price < upperBound);
        }
        return allSkins.filter(skin => skin.price > (userValue * 1.05));
    }, [userItems, allSkins, activeMultiplier, totalUserValue]);

    const circumference = 2 * Math.PI * 45; // 2 * pi * radius
    const winArcOffset = circumference - (circumference * (chance / 100));

    const renderGaugeContent = () => {
        if (gameState === 'success') return <h3 className="text-xl font-bold text-green-400">SUCCESSFUL!</h3>;
        if (gameState === 'failure') return <h3 className="text-xl font-bold text-red-500">FAILED</h3>;
        return (
            <>
                <p className="gauge-chance-percent">{chance.toFixed(2)}%</p>
                <p className="gauge-chance-label">{getChanceLabel(chance)}</p>
            </>
        );
    };
    
    return (
        <div className={`csgo-v2-page upgrader-page ${gameState}`}>
            <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors z-10">
                <ArrowLeftIcon className="w-5 h-5" /> Back
            </button>
            <div className="upgrader-v2-main">
                <div className="upgrader-v2-slot">
                     {gameState === 'success' && wonItem ? (
                        <div className="upgrader-v2-slot-inner-single text-center">
                            <div>
                                <img src={wonItem.imageUrl} alt={wonItem.skin} className={`rarity-glow-${wonItem.rarity}`} />
                                <p className={`font-bold text-sm truncate text-rarity-${wonItem.rarity}`}>{wonItem.skin}</p>
                                <p className="text-sm text-green-400 font-semibold">${wonItem.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ) : userItems.length > 0 ? (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                            {userItems.length === 1 ? (
                                <div className="upgrader-v2-slot-inner-single">
                                    <img src={userItems[0].imageUrl} alt={userItems[0].skin} />
                                </div>
                            ) : userItems.length === 2 ? (
                                <div className="upgrader-v2-slot-inner-duo">
                                    <img src={userItems[0].imageUrl} alt={userItems[0].skin} />
                                    <img src={userItems[1].imageUrl} alt={userItems[1].skin} />
                                </div>
                            ) : (
                                <div className="upgrader-v2-slot-inner-multi">
                                    {userItems.slice(0, 8).map(item => (
                                        <img key={item.instanceId} src={item.imageUrl} alt={item.skin} />
                                    ))}
                                    {userItems.length > 8 && (
                                        <div className="w-16 h-16 flex items-center justify-center font-bold text-sm text-gray-400 bg-black/30 rounded">
                                            +{userItems.length - 8}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-center mt-2">
                                <p className="font-bold text-sm truncate text-white">{userItems.length} Item{userItems.length > 1 ? 's' : ''}</p>
                                <p className="text-sm text-green-400 font-semibold">${totalUserValue.toFixed(2)}</p>
                            </div>
                        </div>
                    ) : <p className="text-gray-500">Select your items</p>}
                </div>
                <div className="upgrader-v2-core">
                    <div className="upgrader-v2-chance-display">
                        <div className="gauge-pointer"></div>
                        <div className="gauge-svg-container" style={{ transform: `rotate(${gaugeRotation}deg)` }}>
                            <svg viewBox="0 0 100 100" className="gauge-svg">
                                <circle cx="50" cy="50" r="45" className="gauge-bg-arc" strokeDasharray={circumference} />
                                <circle cx="50" cy="50" r="45" className="gauge-win-arc" strokeDasharray={circumference} strokeDashoffset={winArcOffset} />
                            </svg>
                        </div>
                         <div className="gauge-inner">{renderGaugeContent()}</div>
                    </div>
                    <div className="mt-4">
                        {gameState === 'idle' && <button onClick={handleUpgrade} disabled={userItems.length === 0 || !targetItem || gameState !== 'idle'} className="upgrade-v2-button">Upgrade</button>}
                        {gameState === 'success' && <div className="flex gap-2"><button onClick={handleSell} className="upgrade-v2-button sell">Sell for ${wonItem?.price.toFixed(2)}</button><button onClick={handleKeep} className="upgrade-v2-button again">Keep Item</button></div>}
                        {gameState === 'failure' && <button onClick={resetGame} className="upgrade-v2-button again">Try Again</button>}
                    </div>
                </div>
                <div className="upgrader-v2-slot">
                    {targetItem ? (
                        <div className="upgrader-v2-slot-inner-single text-center">
                           <div>
                             <img src={targetItem.imageUrl} alt={targetItem.skin} className={`rarity-glow-${targetItem.rarity}`} />
                             <p className={`font-bold text-sm truncate text-rarity-${targetItem.rarity}`}>{targetItem.skin}</p>
                             <p className="text-sm text-green-400 font-semibold">${targetItem.price.toFixed(2)}</p>
                           </div>
                        </div>
                    ) : <p className="text-gray-500">Select target item</p>}
                </div>
            </div>
            
            <div className="inventory-section">
                <div className="inventory-panel">
                    <h3 className="text-lg font-bold mb-2 text-center text-gray-300">Your Skins ({userInventory.length})</h3>
                     {userInventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                           <p className="text-lg font-semibold">Inventory is empty.</p>
                           <p className="text-sm">Open a case and "Keep" an item to see it here.</p>
                        </div>
                     ) : (
                        <div className="inventory-grid">
                            {userInventory.map(item => (
                                <SkinCard
                                    key={item.instanceId}
                                    item={item}
                                    onSelect={() => handleUserItemSelect(item)}
                                    isSelected={userItems.some(i => i.instanceId === item.instanceId)}
                                />
                            ))}
                        </div>
                     )}
                </div>
                <div className="inventory-panel">
                    <h3 className="text-lg font-bold text-center text-gray-300">Target Skins</h3>
                    <div className="multiplier-filters">
                        {MULTIPLIERS.map(m => (
                            <button key={m} onClick={() => setActiveMultiplier(m === activeMultiplier ? null : m)} disabled={userItems.length === 0 || gameState !== 'idle'} className={`multiplier-btn ${activeMultiplier === m ? 'active' : ''}`}>
                                {m}x
                            </button>
                        ))}
                    </div>
                    <div className="inventory-grid">
                        {targetableSkins.map(item => (
                            <SkinCard
                                key={item.id}
                                item={item}
                                onSelect={() => gameState === 'idle' && setTargetItem(item)}
                                isSelected={targetItem?.id === item.id}
                                isDisabled={userItems.length === 0}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSGOUpgrader;
