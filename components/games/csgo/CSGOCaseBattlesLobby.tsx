import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { SetStateAction } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { allCSGOCases } from './data';
import type { CSGOCase, CSGOBattle, CSGOBattlePlayer, CSGOItem, CSGOItemRarity } from '../../../types';
import ArrowLeftIcon from '../../icons/ArrowLeftIcon';
import PlusIcon from '../../icons/PlusIcon';
import UsersIcon from '../../icons/UsersIcon';
import RefreshCwIcon from '../../icons/RefreshCwIcon';
import CoinIcon from '../../icons/CoinIcon';
import useAnimatedBalance from '../../../hooks/useAnimatedBalance';
import { useSound } from '../../../hooks/useSound';
import CloseIcon from '../../icons/CloseIcon';
import PlusSquareIcon from '../../icons/PlusSquareIcon';
import SearchIcon from '../../icons/SearchIcon';

const FAKE_BOT_NAMES = ['Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Bot_Delta', 'Bot_Echo', 'Bot_Foxtrot'];
const FAKE_AVATARS = [
    'https://i.imgur.com/s6p4eF8.png',
    'https://i.imgur.com/5J7m1jR.png',
    'https://i.imgur.com/9n9s8Z2.png',
    'https://i.imgur.com/cO1k2L4.png',
    'https://i.imgur.com/z1kH0B5.png',
];

const RARITY_COLORS: Record<CSGOItemRarity, string> = {
    'Mil-Spec': '#3b82f6', 'Restricted': '#8b5cf6', 'Classified': '#ec4899',
    'Covert': '#ef4444', 'Contraband': '#f97316', 'Extraordinary': '#f59e0b',
    'Consumer': '#d1d5db', 'Industrial': '#60a5fa',
};

const pickWinningItem = (csgoCase: CSGOCase): CSGOItem => {
    const totalOdds = 100;
    let random = Math.random() * totalOdds;
    for (const item of csgoCase.items) {
        if (random < item.odds) return item;
        random -= item.odds;
    }
    return csgoCase.items[csgoCase.items.length - 1];
};


// Main Component Props
interface CSGOCaseBattlesLobbyProps {
  battles: CSGOBattle[];
  setBattles: React.Dispatch<React.SetStateAction<CSGOBattle[]>>;
  onNavigate: (path: string) => void;
  battleId?: string;
}

// Sub-components are defined within this file to avoid creating new files.

// #region Create Battle Modal
const CreateBattleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (cases: CSGOCase[], playerCount: number, isReverseMode: boolean) => void;
}> = ({ isOpen, onClose, onCreate }) => {
    const [selectedCases, setSelectedCases] = useState<Map<string, { caseInfo: CSGOCase; quantity: number }>>(new Map());
    const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
    const [isReverseMode, setIsReverseMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCasePicker, setShowCasePicker] = useState(false);

    const filteredCases = useMemo(() => 
        allCSGOCases.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    , [searchTerm]);
    
    const totalCaseCount = useMemo(() => Array.from(selectedCases.values()).reduce((sum, { quantity }) => sum + quantity, 0), [selectedCases]);
    const totalCost = useMemo(() => Array.from(selectedCases.values()).reduce((sum, { caseInfo, quantity }) => sum + (caseInfo.price * quantity), 0), [selectedCases]);

    const handleAddCase = (csgoCase: CSGOCase) => {
        if (totalCaseCount >= 10) return;

        setSelectedCases(prev => {
            const newSelectedCases = new Map(prev);
            const existing = newSelectedCases.get(csgoCase.id);
            if (existing) {
                newSelectedCases.set(csgoCase.id, { ...existing, quantity: existing.quantity + 1 });
            } else {
                newSelectedCases.set(csgoCase.id, { caseInfo: csgoCase, quantity: 1 });
            }
            return newSelectedCases;
        });
        setShowCasePicker(false);
    };

    const handleQuantityChange = (caseId: string, delta: number) => {
        setSelectedCases(prev => {
            const newSelectedCases = new Map(prev);
            const existing = newSelectedCases.get(caseId);

            if (!existing) return prev; // No change

            // Recalculate totalCaseCount inside the updater to avoid stale closures
            const currentTotal = Array.from(newSelectedCases.values()).reduce((sum, { quantity }) => sum + quantity, 0);

            if (delta > 0 && currentTotal >= 10) {
                return prev; // Don't add if at max capacity
            }

            const newQuantity = existing.quantity + delta;

            if (newQuantity <= 0) {
                newSelectedCases.delete(caseId);
            } else {
                newSelectedCases.set(caseId, { ...existing, quantity: newQuantity });
            }

            return newSelectedCases;
        });
    };


    const handleCreateClick = () => {
        if (totalCaseCount > 0) {
            const casesArray: CSGOCase[] = [];
            selectedCases.forEach(({ caseInfo, quantity }) => {
                for (let i = 0; i < quantity; i++) {
                    casesArray.push(caseInfo);
                }
            });
            onCreate(casesArray, playerCount, isReverseMode);
            onClose();
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setSelectedCases(new Map());
            setPlayerCount(2);
            setIsReverseMode(false);
            setShowCasePicker(false);
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 font-poppins" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Create a Battle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </header>
                <main className="p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Selected Cases ({totalCaseCount}/10) - Total: ${totalCost.toFixed(2)}</h3>
                        <div className="bg-slate-800/50 p-2 rounded-md min-h-[80px] flex flex-col gap-2 max-h-48 overflow-y-auto">
                           {Array.from(selectedCases.values()).map(({ caseInfo, quantity }) => (
                                <div key={caseInfo.id} className="flex items-center justify-between bg-slate-700 p-2 rounded shrink-0">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <img src={caseInfo.imageUrl} alt={caseInfo.name} className="w-12 h-12 object-contain flex-shrink-0"/>
                                        <span className="text-sm font-semibold truncate flex-grow">{caseInfo.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleQuantityChange(caseInfo.id, -1)} className="w-7 h-7 bg-slate-600 hover:bg-slate-500 rounded-md font-bold transition-colors">-</button>
                                        <span className="w-8 text-center font-bold">{quantity}</span>
                                        <button onClick={() => handleQuantityChange(caseInfo.id, 1)} disabled={totalCaseCount >= 10} className="w-7 h-7 bg-slate-600 hover:bg-slate-500 rounded-md font-bold transition-colors disabled:opacity-50">+</button>
                                    </div>
                                </div>
                            ))}
                            {totalCaseCount < 10 && (
                                <button onClick={() => setShowCasePicker(true)} className="w-full h-12 bg-slate-700/50 hover:bg-slate-700 rounded-md flex items-center justify-center border-2 border-dashed border-slate-600">
                                    <PlusSquareIcon className="w-6 h-6 text-slate-400"/>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                         <div>
                            <h3 className="text-sm font-semibold mb-2">Players</h3>
                            <div className="flex gap-2">
                                {[2,3,4].map(num => (
                                    <button key={num} onClick={() => setPlayerCount(num as 2|3|4)} className={`px-4 py-2 rounded-md font-bold transition-colors ${playerCount === num ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold mb-2">Game Mode</h3>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isReverseMode} onChange={() => setIsReverseMode(p => !p)} className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500"/>
                                <span className="font-semibold">Reverse Mode</span>
                             </label>
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-slate-700">
                    <button onClick={handleCreateClick} disabled={totalCaseCount === 0} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-md font-bold text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                        Create Battle
                    </button>
                </footer>
            </div>

            {showCasePicker && (
                 <div className="fixed inset-0 bg-black/80 z-[130] flex items-center justify-center p-4" onClick={() => setShowCasePicker(false)}>
                    <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
                           <div className="relative">
                              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input type="text" placeholder="Search cases..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                           </div>
                        </header>
                        <main className="p-4 overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredCases.map(c => (
                                    <div key={c.id} onClick={() => handleAddCase(c)} className="cursor-pointer p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md text-center">
                                        <img src={c.imageUrl} alt={c.name} className="w-24 h-24 mx-auto object-contain"/>
                                        <p className="text-xs font-semibold mt-2 truncate">{c.name}</p>
                                        <p className="text-xs font-bold text-yellow-400">${c.price.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </main>
                    </div>
                 </div>
            )}
        </div>
    );
};
// #endregion

// #region Battle View
type SpinResult = {
    key: number;
    reelItems: CSGOItem[];
    style: React.CSSProperties;
    winner: CSGOItem;
};

const CaseBattleView: React.FC<{
    battle: CSGOBattle;
    setBattles: React.Dispatch<React.SetStateAction<CSGOBattle[]>>;
    onNavigate: (path: string) => void;
}> = ({ battle: initialBattle, setBattles, onNavigate }) => {
    const { profile } = useUser();
    const { playSound } = useSound();
    const [battle, setBattle] = useState(initialBattle);
    const [currentRound, setCurrentRound] = useState(0);
    const [gamePhase, setGamePhase] = useState<'joining' | 'starting' | 'spinning' | 'round_end' | 'finished'>('joining');
    const [playerSpinResults, setPlayerSpinResults] = useState<Record<string, SpinResult | null>>({});
    
    const isMountedRef = useRef(true);
    const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { 
            isMountedRef.current = false; 
            if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
        };
    }, []);

    const roundsTotal = useMemo(() => battle.cases.length, [battle.cases]);

    const handleReturnToLobby = () => {
        setBattles(prev => prev.filter(b => b.id !== battle.id));
        onNavigate('/game/csgo/battles');
    };

    useEffect(() => {
        if (gamePhase !== 'joining' || !battle.players.includes(null)) return;

        const botTimer = setTimeout(() => {
            if (!isMountedRef.current) return;
            
            const newPlayers = [...battle.players];
            let userPlaced = newPlayers.some(p => p?.id === 'user');

            for (let i = 0; i < newPlayers.length; i++) {
                if (newPlayers[i] === null) {
                    if (!userPlaced) {
                        newPlayers[i] = { id: 'user', name: profile.username, avatarUrl: 'https://i.imgur.com/sIqj4t2.png', isBot: false, items: [], totalValue: 0 };
                        userPlaced = true;
                    } else {
                        newPlayers[i] = { id: `bot-${Date.now()}-${i}`, name: FAKE_BOT_NAMES[Math.floor(Math.random() * FAKE_BOT_NAMES.length)], avatarUrl: FAKE_AVATARS[Math.floor(Math.random() * FAKE_AVATARS.length)], isBot: true, items: [], totalValue: 0 };
                    }
                }
            }
            
            const updatedBattle = { ...battle, players: newPlayers, status: 'live' as const };
            setBattle(updatedBattle);
            setBattles(prev => prev.map(b => b.id === updatedBattle.id ? updatedBattle : b));
            setGamePhase('starting');
        }, 2500);

        return () => clearTimeout(botTimer);
    }, [gamePhase, battle, profile.username, setBattles]);

    useEffect(() => {
        if (gamePhase !== 'starting') return;
        const startTimer = setTimeout(() => { if (isMountedRef.current) setGamePhase('spinning'); }, 1000);
        return () => clearTimeout(startTimer);
    }, [gamePhase]);

    useEffect(() => {
        if (gamePhase !== 'spinning' || currentRound >= roundsTotal) return;

        const caseForThisRound = battle.cases[currentRound];
        if (!caseForThisRound) {
            if (isMountedRef.current) setGamePhase('finished');
            return;
        }

        const winnersByPlayerId: Record<string, CSGOItem> = {};
        const initialSpinResults: Record<string, SpinResult | null> = {};

        battle.players.forEach(player => {
            if (player) {
                const winner = pickWinningItem(caseForThisRound);
                winnersByPlayerId[player.id] = winner;
                const reelLength = 100;
                const winnerIndex = reelLength - 10;
                const newReelItems = Array.from({ length: reelLength }, (_, j) => j === winnerIndex ? winner : pickWinningItem(caseForThisRound));
                initialSpinResults[player.id] = {
                    key: Date.now() + Math.random(),
                    reelItems: newReelItems,
                    style: { transform: 'translateX(0px)', transition: 'none' },
                    winner: winner
                };
            }
        });

        setPlayerSpinResults(initialSpinResults);

        const spinDuration = 7000;
        let animationTriggerTimer: ReturnType<typeof setTimeout>;

        animationTriggerTimer = setTimeout(() => {
            if (!isMountedRef.current) return;
            const itemWidth = 108;
            const containerWidth = 350; // Estimated width
            
            const finalSpinResults: Record<string, SpinResult | null> = {};
            Object.keys(initialSpinResults).forEach(playerId => {
                const spinResult = initialSpinResults[playerId];
                if(spinResult) {
                    const winnerIndex = 100 - 10;
                    const randomOffset = (Math.random() - 0.5) * (itemWidth * 0.8);
                    const finalPosition = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2) + randomOffset;
                    finalSpinResults[playerId] = {
                        ...spinResult,
                        style: {
                            transition: `transform ${spinDuration}ms cubic-bezier(0.2, 0.85, 0.25, 1)`,
                            transform: `translateX(-${finalPosition}px)`
                        }
                    };
                }
            });
            setPlayerSpinResults(finalSpinResults);
        }, 100);

        if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
        const startTime = performance.now();
        const playTickingSound = () => {
            const elapsedTime = performance.now() - startTime;
            if (!isMountedRef.current || elapsedTime >= spinDuration) { if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current); return; }
            playSound('spin_tick');
            const progress = elapsedTime / spinDuration;
            const nextInterval = 80 + (420 * progress);
            soundTimeoutRef.current = setTimeout(playTickingSound, nextInterval);
        };
        playTickingSound();

        const roundTimer = setTimeout(() => {
            if (!isMountedRef.current) return;
            playSound('win');
            setBattle(prev => ({
                ...prev,
                players: prev.players.map(p => p ? { ...p, items: [...p.items, winnersByPlayerId[p.id]], totalValue: p.totalValue + winnersByPlayerId[p.id].price } : null)
            }));
            setGamePhase('round_end');
        }, spinDuration);

        return () => {
            clearTimeout(animationTriggerTimer);
            clearTimeout(roundTimer);
            if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
        };
    }, [gamePhase, currentRound, battle, playSound, roundsTotal]);


    useEffect(() => {
        if (gamePhase !== 'round_end') return;
        const nextRoundTimer = setTimeout(() => {
            if (!isMountedRef.current) return;
            const nextRound = currentRound + 1;
            if (nextRound >= roundsTotal) {
                setGamePhase('finished');
            } else {
                setCurrentRound(nextRound);
                setGamePhase('spinning');
            }
        }, 2000);
        return () => clearTimeout(nextRoundTimer);
    }, [gamePhase, currentRound, roundsTotal]);

    useEffect(() => {
        if (gamePhase === 'finished') {
            const winner = battle.players.reduce((prev, curr) => (prev && prev.totalValue > (curr?.totalValue || -1)) ? prev : curr, null);
            const finalBattleState = { ...battle, status: 'finished' as const, winnerId: winner?.id };
            setBattle(finalBattleState);
            setBattles(prev => prev.map(b => b.id === finalBattleState.id ? finalBattleState : b));
        }
    }, [gamePhase, battle, setBattles]);

    const winnerId = battle.status === 'finished' ? battle.winnerId : null;

    return (
        <div className="csgo-battle-page">
            <div className="battle-view-header w-full py-2 px-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {gamePhase === 'finished' && (
                            <button onClick={handleReturnToLobby} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10" aria-label="Back to Battles Lobby">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                        )}
                        <span className="font-bold text-lg">ROUNDS {Math.min(currentRound + 1, roundsTotal)}/{roundsTotal}</span>
                        <div className="flex items-center -space-x-4">
                            {battle.cases.slice(0, 10).map((c, i) => (
                                <img key={i} src={c.imageUrl} alt={c.name} className={`w-12 h-12 object-contain transition-all duration-300 ${i === currentRound && gamePhase === 'spinning' ? 'scale-125 z-10 -translate-y-1 shadow-lg shadow-yellow-400/50' : ''} ${i < currentRound ? 'opacity-30' : 'opacity-100'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-semibold">DETAILS</button>
                        <p className="text-lg font-bold">TOTAL COST: <span className="text-green-400">${battle.cost.toFixed(2)}</span></p>
                    </div>
                </div>
            </div>
            
            <main className="flex-grow container mx-auto p-4 arena-grid" style={{ gridTemplateColumns: `repeat(${battle.playerCount}, 1fr)`}}>
                {Array.from({ length: battle.playerCount }).map((_, idx) => {
                    const player = battle.players[idx];
                    if (!player) return (
                        <div key={idx} className="player-area flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-100"></div></div>
                    );
                    
                    const isWinner = winnerId === player.id;
                    
                    return (
                        <div key={player.id} className={`player-area ${isWinner ? 'winner-glow' : ''}`}>
                             {gamePhase === 'finished' && (
                                <div className={`battle-result-overlay ${isWinner ? 'win' : 'loss'}`}>
                                    {isWinner ? 'Winner!' : 'Defeat'}
                                </div>
                            )}
                            <div className="player-header">
                                <img src={player.avatarUrl} alt={player.name} className="player-avatar"/>
                                <div className="flex-grow"><p className="font-bold text-white truncate">{player.name}</p></div>
                                <p className="font-bold text-lg text-green-400">${player.totalValue.toFixed(2)}</p>
                            </div>

                            <div className="shrink-0 h-[120px]">
                                {gamePhase === 'spinning' && playerSpinResults[player.id] && (
                                    <div className="csgo-multi-spinner-container">
                                        <div className="csgo-multi-spinner-marker !bg-red-500 !shadow-red-500"></div>
                                        <div className="csgo-reel-wrapper">
                                            <div className="csgo-reel" style={playerSpinResults[player.id]?.style}>
                                                {playerSpinResults[player.id]?.reelItems.map((item, index) => (
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
                                    </div>
                                )}
                            </div>

                            <div className="player-item-grid flex-grow">
                                {player.items.map((item, index) => (
                                    <div 
                                      key={`${item.id}-${index}`} 
                                      className={`battle-item-card ${index === player.items.length - 1 && gamePhase === 'round_end' ? 'animate-multi-win-fade-in' : ''}`}
                                      style={{'--rarity-color': RARITY_COLORS[item.rarity]} as React.CSSProperties}>
                                        <img src={item.imageUrl} alt={item.skin} className={`battle-item-card-image rarity-glow-${item.rarity}`} />
                                        <p className="battle-item-card-price">${item.price.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};
// #endregion

// #region Lobby View
const LobbyView: React.FC<Omit<CSGOCaseBattlesLobbyProps, 'battleId'>> = ({ battles, setBattles, onNavigate }) => {
    const { profile } = useUser();
    const animatedBalance = useAnimatedBalance(profile.balance);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateBattle = (cases: CSGOCase[], playerCount: 2 | 3 | 4, isReverseMode: boolean) => {
        const costPerPlayer = cases.reduce((sum, c) => sum + c.price, 0);
        const newBattle: CSGOBattle = {
            id: `battle-${Date.now()}-${Math.random()}`,
            cases,
            playerCount,
            isReverseMode,
            status: 'waiting',
            players: Array(playerCount).fill(null),
            cost: costPerPlayer * playerCount,
        };
        setBattles(prev => [newBattle, ...prev]);
        onNavigate(`/game/csgo/battles/${newBattle.id}`);
    };
    
    return (
        <div className="csgo-lobby-page min-h-screen">
             <CreateBattleModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateBattle} />
            <header className="shrink-0 w-full bg-[#1a1b2f]/50 backdrop-blur-sm p-3 flex items-center justify-between z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('/game/csgo')} aria-label="Back to CSGO Menu" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold uppercase text-red-500">Case Battles</h1>
                </div>
                <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
            </header>
            
             <div className="csgo-sub-nav">
                <div className="container mx-auto flex items-center">
                    <button className="csgo-sub-nav-item" onClick={() => onNavigate('/game/csgo')}>Cases</button>
                    <button className="csgo-sub-nav-item" onClick={() => onNavigate('/game/csgo/upgrader')}>Upgrader</button>
                    <button className="csgo-sub-nav-item active">Case Battles</button>
                    <button className="csgo-sub-nav-item coming-soon" onClick={() => alert('Coming Soon!')}>Contracts<span className="coming-soon-badge">SOON</span></button>
                </div>
            </div>
            
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white">Active Battles</h2>
                        <button className="p-2 text-gray-400 hover:text-white"><RefreshCwIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md font-bold text-white transition-colors">
                        <PlusIcon className="w-5 h-5"/>
                        Create Battle
                    </button>
                </div>

                {battles.length === 0 ? (
                     <div className="text-center py-20 bg-slate-800/20 rounded-lg">
                        <h3 className="text-2xl font-bold text-slate-300">No Active Battles</h3>
                        <p className="text-slate-500 mt-2">Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                       {battles.map(battle => (
                            <div key={battle.id} className="battle-lobby-card rounded-lg p-4 flex flex-col">
                                <div className="battle-cases-preview mb-4">
                                    {battle.cases.slice(0, 5).map((c, i) => <img key={i} src={c.imageUrl} alt={c.name} />)}
                                    {battle.cases.length > 5 && <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold z-10">+{battle.cases.length - 5}</div>}
                                </div>
                                <div className="flex justify-between items-center text-sm mb-4">
                                    <div className="flex items-center gap-1 text-yellow-400 font-bold"><CoinIcon className="w-4 h-4" /> {(battle.cost / battle.playerCount).toFixed(2)}</div>
                                    <div className="flex items-center gap-1 text-slate-400 font-semibold"><UsersIcon className="w-4 h-4" /> {battle.players.filter(Boolean).length}/{battle.playerCount}</div>
                                </div>
                                <div className="battle-player-slots mb-4">
                                    {Array.from({ length: battle.playerCount }).map((_, i) => {
                                      const player = battle.players[i];
                                      return (
                                        <div key={i} className={`battle-player-slot ${player ? 'filled' : ''}`}>
                                            {player ? <img src={player.avatarUrl} alt={player.name} /> : <UsersIcon className="w-5 h-5 text-slate-500" />}
                                        </div>
                                      )
                                    })}
                                </div>
                                <button disabled={battle.status !== 'waiting' || battle.players.filter(Boolean).length >= battle.playerCount} onClick={() => onNavigate(`/game/csgo/battles/${battle.id}`)} className="mt-auto w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-bold text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                                   {battle.status === 'waiting' ? 'Join Battle' : 'View Battle'}
                                </button>
                            </div>
                       ))}
                    </div>
                )}
            </main>
        </div>
    );
};
// #endregion

const CSGOCaseBattlesLobby: React.FC<CSGOCaseBattlesLobbyProps> = ({ battles, setBattles, onNavigate, battleId }) => {
    const battle = useMemo(() => battles.find(b => b.id === battleId), [battles, battleId]);

    useEffect(() => {
        // If a battleId is given but the battle is not in our state (e.g., page refresh), navigate back to the lobby.
        if (battleId && !battle) {
            console.warn(`Battle with ID ${battleId} not found. Redirecting to lobby.`);
            onNavigate('/game/csgo/battles');
        }
    }, [battleId, battle, onNavigate]);

    if (battleId) {
        if (battle) {
            // Battle found, render it.
            return <CaseBattleView battle={battle} setBattles={setBattles} onNavigate={onNavigate} />;
        }
        // Battle not found yet, show a loading/redirecting state to avoid a blank screen.
        // The useEffect above will trigger the redirect.
        return (
            <div className="csgo-lobby-page min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl">Joining battle...</p>
                </div>
            </div>
        );
    }
    
    // No battleId, so we show the lobby.
    return <LobbyView battles={battles} setBattles={setBattles} onNavigate={onNavigate} />;
};

export default CSGOCaseBattlesLobby;