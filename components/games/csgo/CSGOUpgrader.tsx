import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Page } from '../../../App.tsx';
import { useUser } from '../../../contexts/UserContext.tsx';
import { allCSGOCases } from './data.ts';
import type { CSGOItem, CSGOInventoryItem, CSGOItemRarity } from '../../../types.ts';
import CheckIcon from '../../icons/CheckIcon.tsx';
import { useSound } from '../../../hooks/useSound.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import useAnimatedBalance from '../../../hooks/useAnimatedBalance.tsx';


const RARITY_COLORS: Record<CSGOItemRarity, string> = {
    'Mil-Spec': '#3b82f6', 'Restricted': '#8b5cf6', 'Classified': '#ec4899',
    'Covert': '#ef4444', 'Contraband': '#f97316', 'Extraordinary': '#f59e0b',
    'Consumer': '#d1d5db', 'Industrial': '#60a5fa',
};

const getChanceLabel = (chance: number): string => {
    if (chance >= 95) return "Guaranteed"; if (chance > 80) return "Very High";
    if (chance > 60) return "High"; if (chance > 40) return "Medium";
    if (chance > 20) return "Low"; return "Very Low";
};

const SkinCard: React.FC<{ item: CSGOItem | CSGOInventoryItem; onSelect: () => void; isSelected: boolean; isDisabled?: boolean; }> = ({ item, onSelect, isSelected, isDisabled }) => (
    <div
        onClick={isDisabled ? undefined : onSelect}
        className={`relative p-2 rounded-md bg-slate-800/50 border border-slate-700 cursor-pointer transition-all duration-200 ${isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'hover:border-slate-500'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {isSelected && <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center z-10"><CheckIcon className="w-3 h-3 text-white" /></div>}
        <div className="h-20 flex items-center justify-center">
             <img src={item.imageUrl} alt={item.skin} className={`max-w-full max-h-full object-contain rarity-glow-${item.rarity}`} />
        </div>
        <div className="mt-2 text-center">
            <p className="text-xs font-bold text-green-400">${item.price.toFixed(2)}</p>
        </div>
    </div>
);

interface CSGOUpgraderProps {
  setPage: (page: Page) => void;
  inventory: CSGOInventoryItem[];
  addToInventory: (items: CSGOItem[]) => void;
  removeFromInventory: (instanceIds: string[]) => void;
}

const CSGOUpgrader: React.FC<CSGOUpgraderProps> = ({ setPage, inventory, addToInventory, removeFromInventory }) => {
    const { adjustBalance } = useUser();
    const { profile } = useAuth();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const { playSound } = useSound();
    
    const allSkins = useMemo(() => Array.from(new Map(allCSGOCases.flatMap(c => c.items).map(item => [item.id, item])).values()).sort((a, b) => a.price - b.price), []);
    
    const [userItems, setUserItems] = useState<CSGOInventoryItem[]>([]);
    const [targetItem, setTargetItem] = useState<CSGOItem | null>(null);
    const [wonItem, setWonItem] = useState<CSGOInventoryItem | null>(null);
    const [gameState, setGameState] = useState<'idle' | 'upgrading' | 'success' | 'failure'>('idle');
    const [gaugeRotation, setGaugeRotation] = useState(0);

    const totalUserValue = useMemo(() => userItems.reduce((sum, item) => sum + item.price, 0), [userItems]);
    
    useEffect(() => { setTargetItem(null); }, [userItems]);

    const { chance } = useMemo(() => {
        if (!targetItem || totalUserValue <= 0) return { chance: 0 };
        return { chance: Math.min(95, (totalUserValue / targetItem.price) * 95) };
    }, [targetItem, totalUserValue]);
    
    const handleUserItemSelect = (item: CSGOInventoryItem) => {
        if (gameState !== 'idle') return;
        setUserItems(prev => prev.some(i => i.instanceId === item.instanceId) ? prev.filter(i => i.instanceId !== item.instanceId) : [...prev, item]);
    };
    
    const resetGame = useCallback(() => {
        setUserItems([]); setTargetItem(null); setWonItem(null); setGameState('idle');
    }, []);

    const handleUpgrade = async () => {
        if (gameState !== 'idle' || userItems.length === 0 || !targetItem) return;
        setGameState('upgrading');
        playSound('bet');

        removeFromInventory(userItems.map(i => i.instanceId));
        const isWin = Math.random() * 100 < chance;
        const winArc = (chance / 100) * 360;
        const targetAngle = isWin ? Math.random() * (winArc - 10) + 5 : winArc + Math.random() * (360 - winArc - 10) + 5;
        setGaugeRotation(g => Math.floor(g / 360) * 360 + (4 * 360) + targetAngle);
        
        setTimeout(() => {
            if (isWin) {
                const newItem: CSGOInventoryItem = { ...targetItem, instanceId: `new-${Date.now()}` };
                setWonItem(newItem); setGameState('success');
            } else { setGameState('failure'); }
        }, 6100);
    };

    const handleSell = () => { if (wonItem) { adjustBalance(wonItem.price); resetGame(); } };
    const handleKeep = () => { if (wonItem) { addToInventory([wonItem]); resetGame(); } };
    
    const targetableSkins = useMemo(() => allSkins.filter(skin => skin.price > totalUserValue * 1.05), [allSkins, totalUserValue]);
    
    const handleMultiplierSelect = (multiplier: number) => {
        if (userItems.length === 0) return;
        const targetValue = totalUserValue * multiplier;
        const suitableSkins = targetableSkins.filter(s => s.price >= targetValue);
        if (suitableSkins.length > 0) {
            const bestMatch = suitableSkins.reduce((prev, curr) => (curr.price < prev.price ? curr : prev));
            setTargetItem(bestMatch);
        } else {
            // If no suitable skin, maybe notify user? For now, do nothing.
        }
    };
    
    const circumference = 2 * Math.PI * 140;

    return (
        <div className="csgo-page upgrader-v5-wrapper">
            <div className="csgo-sub-nav sticky top-0 z-20">
                <div className="container mx-auto flex items-center justify-between">
                     <div className="flex items-center">
                         <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'lobby' })}>Mini Games</button>
                        <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-lobby' })}>Cases</button>
                        <button className="csgo-sub-nav-item active">Upgrader</button>
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

            <div className="upgrader-v5-main">
                <div className="upgrader-v5-panel">
                    <h3>Your Items ({inventory.length}) - ${totalUserValue.toFixed(2)}</h3>
                    <div className="upgrader-v5-inventory-grid">
                        {inventory.map(item => <SkinCard key={item.instanceId} item={item} onSelect={() => handleUserItemSelect(item)} isSelected={userItems.some(i => i.instanceId === item.instanceId)} /> )}
                    </div>
                </div>

                <div className="upgrader-v5-gauge-wrapper">
                    <div className="upgrader-v5-io">
                        <div className="hex-slot-v5" style={{ '--rarity-color': userItems.length > 0 ? RARITY_COLORS[userItems[0].rarity] : '#2d343e' } as React.CSSProperties}>
                            {userItems.length > 0 ? (
                                <img src={userItems[0].imageUrl} alt="Selected Item" className="w-32 h-32 object-contain"/>
                            ) : <span className="text-xs text-slate-500">Your Item</span>}
                        </div>
                        <div className="hex-slot-v5" style={{ '--rarity-color': targetItem ? RARITY_COLORS[targetItem.rarity] : '#2d343e' } as React.CSSProperties}>
                            {targetItem ? (
                                <img src={targetItem.imageUrl} alt="Target Item" className="w-32 h-32 object-contain"/>
                            ) : <span className="text-xs text-slate-500">Target Item</span>}
                        </div>
                    </div>

                    <div className="gauge-v5-circle-wrapper">
                        <svg viewBox="0 0 300 300" className="absolute inset-0">
                            <circle cx="150" cy="150" r="140" className="gauge-v5-circle bg" />
                            <circle cx="150" cy="150" r="140" className="gauge-v5-circle win" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * (chance / 100))} />
                        </svg>
                        <div className="gauge-v5-pointer" style={{ transform: `rotate(${gaugeRotation}deg)` }}>
                           <svg viewBox="0 0 24 150"><path d="M12 0 L0 25 L12 18 L24 25 Z" fill="#fde047"/></svg>
                        </div>
                        <div className="gauge-v5-content">
                             {gameState === 'success' ? <h3 className="text-2xl font-bold text-green-400">SUCCESS!</h3> : gameState === 'failure' ? <h3 className="text-2xl font-bold text-red-500">FAILED</h3> : <><p className="text-4xl font-bold">{chance.toFixed(2)}%</p><p className="text-sm text-slate-400">{getChanceLabel(chance)}</p></>}
                        </div>
                    </div>
                    
                    <div className="upgrader-multiplier-selector">
                        {[1.5, 2, 5, 10].map(m => (
                             <button key={m} onClick={() => handleMultiplierSelect(m)} disabled={userItems.length === 0} className="upgrader-multiplier-btn disabled:opacity-50 disabled:cursor-not-allowed">{m}x</button>
                        ))}
                    </div>
                    
                    <div className="h-14 mt-2">
                        {gameState === 'idle' && <button onClick={handleUpgrade} disabled={userItems.length === 0 || !targetItem} className="px-12 py-4 text-xl font-bold bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-all disabled:bg-slate-700 disabled:cursor-not-allowed">Upgrade</button>}
                        {gameState === 'success' && <div className="flex gap-4"><button onClick={handleSell} className="px-6 py-3 bg-green-600 text-black font-bold rounded">Sell for ${wonItem?.price.toFixed(2)}</button><button onClick={handleKeep} className="px-6 py-3 bg-blue-600 text-white font-bold rounded">Keep Item</button></div>}
                        {gameState === 'failure' && <button onClick={resetGame} className="px-12 py-4 text-xl font-bold bg-purple-600 hover:bg-purple-700 rounded-md text-white">Try Again</button>}
                        {gameState === 'upgrading' && <button disabled className="px-12 py-4 text-xl font-bold bg-slate-700 rounded-md text-white">Upgrading...</button>}
                    </div>
                </div>

                 <div className="upgrader-v5-panel">
                    <h3>Target Skins</h3>
                    <div className="upgrader-v5-inventory-grid">
                        {targetableSkins.length > 0 ? targetableSkins.map(item => <SkinCard key={item.id} item={item} onSelect={() => gameState === 'idle' && setTargetItem(item)} isSelected={targetItem?.id === item.id} isDisabled={userItems.length === 0} /> ) : <p className="text-sm text-gray-500 col-span-full text-center py-4">Select an item from your inventory first.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSGOUpgrader;