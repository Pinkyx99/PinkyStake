import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ArrowLeftIcon from '../../icons/ArrowLeftIcon';
import { useUser } from '../../../contexts/UserContext';
import { allCSGOCases } from './data';
import type { CSGOItem, CSGOInventoryItem, CSGOItemRarity } from '../../../types';

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
        <div className="csgo-v2-content-card-rarity-bar !h-1"></div>
        <img src={item.imageUrl} alt={item.skin} className={`rarity-glow-${item.rarity}`} />
        <div className="mt-auto w-full">
            <p className={`text-xs font-bold truncate text-rarity-${item.rarity}`}>{item.skin}</p>
            <p className="text-xs text-green-400 font-semibold">${item.price.toFixed(2)}</p>
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
    const [wheelRotation, setWheelRotation] = useState(0);
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
                return [...prev, item];
            }
        });
    };

    const handleUpgrade = () => {
        if (gameState !== 'idle' || userItems.length === 0 || !targetItem) return;

        setGameState('upgrading');
        const instanceIdsToRemove = userItems.map(item => item.instanceId);
        removeFromCsgoInventory(instanceIdsToRemove);
        
        const win = Math.random() * 100 < chance;
        const baseRotations = 5 * 360;
        const chanceAngle = (chance / 100) * 360;

        let landAngle;
        if (win) {
            const padding = chanceAngle * 0.1;
            landAngle = padding + (Math.random() * (chanceAngle * 0.8));
        } else {
            const lossRange = 360 - chanceAngle;
            const padding = lossRange * 0.1;
            landAngle = chanceAngle + padding + (Math.random() * (lossRange * 0.8));
        }

        const finalRotation = wheelRotation + baseRotations - landAngle;
        setWheelRotation(finalRotation);

        setTimeout(() => {
            if (win) {
                const newItemInstance: CSGOInventoryItem = { ...targetItem, instanceId: `new-${Date.now()}` };
                addItemsToCsgoInventory([targetItem]);
                setWonItem(newItemInstance);
                setUserItems([]);
                setGameState('success');
            } else {
                setUserItems([]);
                setGameState('failure');
            }
            setTargetItem(null);
            setActiveMultiplier(null);
        }, 6000);
    };

    const resetGame = () => {
        setUserItems([]);
        setTargetItem(null);
        setWonItem(null);
        setGameState('idle');
        setActiveMultiplier(null);
    };

    const handleSell = () => {
        if (gameState !== 'success' || !wonItem) return;
        adjustBalance(wonItem.price);
        removeFromCsgoInventory([wonItem.instanceId]);
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
        <div className={`upgrader-page ${gameState}`}>
            <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors z-10">
                <ArrowLeftIcon className="w-5 h-5" /> Back
            </button>
            <div className="upgrade-machine">
                <div className="item-slot">
                     {gameState === 'success' && wonItem ? (
                        <div className="item-slot-inner text-center">
                            <img src={wonItem.imageUrl} alt={wonItem.skin} className={`rarity-glow-${wonItem.rarity}`} />
                            <p className={`font-bold text-sm truncate text-rarity-${wonItem.rarity}`}>{wonItem.skin}</p>
                            <p className="text-sm text-green-400 font-semibold">${wonItem.price.toFixed(2)}</p>
                        </div>
                    ) : userItems.length > 0 ? (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                            <div className="item-slot-inner-multi">
                                {userItems.slice(0, 8).map(item => (
                                    <img key={item.instanceId} src={item.imageUrl} alt={item.skin} className="multi-item-img" />
                                ))}
                                {userItems.length > 8 && (
                                    <div className="multi-item-more">
                                        +{userItems.length - 8}
                                    </div>
                                )}
                            </div>
                            <div className="text-center mt-2">
                                <p className="font-bold text-sm truncate text-white">{userItems.length} Item{userItems.length > 1 ? 's' : ''}</p>
                                <p className="text-sm text-green-400 font-semibold">${totalUserValue.toFixed(2)}</p>
                            </div>
                        </div>
                    ) : <p className="text-gray-500">Select your items</p>}
                </div>
                <div className="upgrade-gauge">
                    <div className="gauge-pointer"></div>
                    <div className="gauge-svg-container" style={{ transform: `rotate(${wheelRotation}deg)` }}>
                        <svg viewBox="0 0 100 100" className="gauge-svg">
                            <circle cx="50" cy="50" r="45" className="gauge-bg-arc" />
                            <circle cx="50" cy="50" r="45" className="gauge-win-arc" strokeDasharray={circumference} strokeDashoffset={winArcOffset} />
                        </svg>
                    </div>
                    <div className="gauge-inner">{renderGaugeContent()}</div>
                    <div className="absolute bottom-[-70px]">
                        {gameState === 'idle' && <button onClick={handleUpgrade} disabled={userItems.length === 0 || !targetItem} className={`upgrade-button ${userItems.length === 0 || !targetItem ? '' : 'ready'}`}>Upgrade</button>}
                        {gameState === 'success' && <div className="flex gap-2"><button onClick={handleSell} className="upgrade-button bg-green-500 hover:bg-green-600">Sell</button><button onClick={resetGame} className="upgrade-button bg-gray-600 hover:bg-gray-500">Play Again</button></div>}
                        {gameState === 'failure' && <button onClick={resetGame} className="upgrade-button bg-gray-600 hover:bg-gray-500">Try Again</button>}
                    </div>
                </div>
                <div className="item-slot">
                    {targetItem ? (
                        <div className="item-slot-inner text-center">
                            <img src={targetItem.imageUrl} alt={targetItem.skin} className={`rarity-glow-${targetItem.rarity}`} />
                            <p className={`font-bold text-sm truncate text-rarity-${targetItem.rarity}`}>{targetItem.skin}</p>
                            <p className="text-sm text-green-400 font-semibold">${targetItem.price.toFixed(2)}</p>
                        </div>
                    ) : <p className="text-gray-500">Select target item</p>}
                </div>
            </div>
            
            <div className="inventory-section mt-8">
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