

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import PumpRulesModal from './pump/PumpRulesModal';
import { useSound } from '../../hooks/useSound';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type GameState = 'config' | 'playing' | 'busted' | 'cashed_out';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const PUMP_DATA: Record<Difficulty, { m: number; p: number }[]> = {
    Easy: [
        { m: 1.02, p: 1 - 0.96 }, { m: 1.07, p: 1 - 0.92 }, { m: 1.11, p: 1 - 0.88 }, 
        { m: 1.17, p: 1 - 0.84 }, { m: 1.23, p: 1 - 0.80 }, { m: 1.29, p: 1 - 0.76 }, 
        { m: 1.36, p: 1 - 0.72 }, { m: 1.44, p: 1 - 0.68 }, { m: 1.53, p: 1 - 0.64 }, 
        { m: 1.63, p: 1 - 0.60 }, { m: 1.75, p: 1 - 0.56 }, { m: 1.88, p: 1 - 0.52 }, 
        { m: 2.04, p: 1 - 0.48 }, { m: 2.23, p: 1 - 0.44 }, { m: 2.45, p: 1 - 0.40 }, 
        { m: 2.72, p: 1 - 0.36 }, { m: 3.06, p: 1 - 0.32 }, { m: 3.50, p: 1 - 0.28 }, 
        { m: 4.08, p: 1 - 0.24 }, { m: 4.90, p: 1 - 0.20 }, { m: 6.10, p: 1 - 0.16 }, 
        { m: 8.10, p: 1 - 0.12 }, { m: 12.20, p: 1 - 0.08 }, { m: 24.50, p: 1 - 0.04 }
    ],
    Medium: [
        { m: 1.11, p: 1 - 0.88 }, { m: 1.27, p: 1 - 0.77 }, { m: 1.46, p: 1 - 0.66956522 },
        { m: 1.69, p: 1 - 0.57826087 }, { m: 1.98, p: 1 - 0.49565217 }, { m: 2.33, p: 1 - 0.42130435 },
        { m: 2.76, p: 1 - 0.35478261 }, { m: 3.31, p: 1 - 0.29565217 }, { m: 4.03, p: 1 - 0.2434651 },
        { m: 4.95, p: 1 - 0.19782609 }, { m: 6.19, p: 1 - 0.15826087 }, { m: 7.88, p: 1 - 0.12434783 },
        { m: 10.25, p: 1 - 0.09565216 }, { m: 13.6, p: 1 - 0.0717751 }, { m: 18, p: 1 - 0.0512675 },
        { m: 26.83, p: 1 - 0.03652174 }, { m: 40.25, p: 1 - 0.0243483 }, { m: 64.4, p: 1 - 0.01521739 },
        { m: 112, p: 1 - 0.00869565 }, { m: 225.40, p: 1 - 0.00434783 }, { m: 563.50, p: 1 - 0.00173913 },
        { m: 2254, p: 1 - 0.000434738 }
    ],
    Hard: [
        { m: 1.23, p: 1 - 0.80 }, { m: 1.55, p: 1 - 0.63333333 }, { m: 1.98, p: 1 - 0.49565217 },
        { m: 2.56, p: 1 - 0.38300 }, { m: 3.36, p: 1 - 0.29181254 }, { m: 4.48, p: 1 - 0.21885940 },
        { m: 6.08, p: 1 - 0.1612485 }, { m: 8.41, p: 1 - 0.11646904 }, { m: 11.92, p: 1 - 0.08221344 },
        { m: 17.34, p: 1 - 0.0575217 }, { m: 26.01, p: 1 - 0.03768116 }, { m: 40.46, p: 1 - 0.02422360 },
        { m: 65, p: 1 - 0.014906 }, { m: 112.70, p: 1 - 0.00869565 }, { m: 206, p: 1 - 0.004485 },
        { m: 413.23, p: 1 - 0.002317154 }, { m: 929.77, p: 1 - 0.00105402 }, { m: 2479.40, p: 1 - 0.00039656 },
        { m: 8677.90, p: 1 - 0.00011293 }, { m: 52060, p: 1 - 0.00001882 }
    ]
};

const PumpGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState(betAmount.toFixed(2));
    const [difficulty, setDifficulty] = useState<Difficulty>('Hard');
    const [gameState, setGameState] = useState<GameState>('config');
    const [multiplier, setMultiplier] = useState(1.00);
    const [pumpCount, setPumpCount] = useState(0);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const isMounted = useRef(true);
    const payoutsContainerRef = useRef<HTMLDivElement>(null);
    const { playSound } = useSound();
    
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => setBetInput(betAmount.toFixed(2)), [betAmount]);
    
    useEffect(() => {
        if (payoutsContainerRef.current && pumpCount > 0) {
            const activeElement = payoutsContainerRef.current.children[pumpCount] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [pumpCount, difficulty]);

    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const resetGame = () => {
        playSound('click');
        setGameState('config');
        setMultiplier(1.00);
        setPumpCount(0);
    };

    const handlePump = async () => {
        if (gameState === 'busted' || gameState === 'cashed_out') return;

        const currentDifficultyData = PUMP_DATA[difficulty];
        if (pumpCount >= currentDifficultyData.length) return;
        
        if (gameState === 'config') {
            if (!profile || betAmount > profile.balance) return;
            playSound('bet');
            await adjustBalance(-betAmount);
            if (!isMounted.current) return;
            setGameState('playing');
        }
        
        playSound('pump');

        const pumpData = currentDifficultyData[pumpCount];
        const popChance = pumpData.p;

        if (Math.random() < popChance) {
            playSound('pop');
            setGameState('busted');
        } else {
            setPumpCount(p => p + 1);
            setMultiplier(pumpData.m);
        }
    };
    
    const handleCashout = async () => {
        if (gameState !== 'playing' || pumpCount === 0) return;
        
        playSound('cashout');
        const winnings = betAmount * multiplier;
        await adjustBalance(winnings);

        if (!isMounted.current) return;
        setGameState('cashed_out');
    };

    const canBet = profile && betAmount <= profile.balance;
    const isConfigPhase = gameState === 'config';
    const balloonScale = 1 + Math.log10(Math.max(1, multiplier)) * 0.15;
    const canPumpMore = gameState === 'playing' && pumpCount < PUMP_DATA[difficulty].length;
    
    const payoutsForBar = useMemo(() => [{m: 1.00, p: 1}, ...PUMP_DATA[difficulty]], [difficulty]);

    return (
        <div className="bg-[#0f172a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
            <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
                 <div className="flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
                </div>
                 <div className="bg-slate-900/50 backdrop-blur-sm rounded-md px-4 py-1.5 border border-slate-700/50">
                    <span className="text-lg font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
            </header>
            
            <main className="flex-grow pt-20 pb-8 px-4 flex flex-col items-center justify-end relative">
                <div ref={payoutsContainerRef} className="absolute top-20 left-4 right-4 flex items-center gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                   {payoutsForBar.map((payout, index) => {
                       const isCurrent = (gameState === 'playing' || gameState === 'cashed_out') && pumpCount === index;
                       return (
                           <div key={index} className={`shrink-0 px-4 py-1 rounded-md transition-all duration-300 ${isCurrent ? 'bg-green-500 text-white font-bold' : 'bg-slate-800 text-gray-400'}`}>
                               {payout.m.toFixed(2)}x
                           </div>
                       );
                   })}
                </div>
                
                <div className="relative w-full flex-grow flex items-center justify-center">
                    {gameState !== 'busted' ? (
                        <div
                            className={`relative transition-transform duration-300 ease-out ${gameState === 'playing' ? 'animate-balloon-pulse' : ''}`}
                            style={{ transform: `scale(${balloonScale})`}}
                        >
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="font-bebas text-7xl text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]">{multiplier.toFixed(2)}x</span>
                            </div>
                            <svg width="280" height="340" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <radialGradient id="redBalloonGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                                        <stop offset="0%" stopColor="#f87171" />
                                        <stop offset="100%" stopColor="#dc2626" />
                                    </radialGradient>
                                </defs>
                                <path 
                                    d="M50 115 C 20 100, 5 75, 15 45 C 25 5, 75 5, 85 45 C 95 75, 80 100, 50 115 Z" 
                                    fill="url(#redBalloonGradient)"
                                    filter="drop-shadow(0 10px 15px rgba(0,0,0,0.3))"
                                />
                                <path d="M35 25 C 40 30, 50 40, 45 50 C 40 60, 30 35, 35 25" fill="#fee2e2" fillOpacity="0.6"/>
                                <path d="M47 114 L 53 114 L 50 120 Z" fill="#991b1b" />
                            </svg>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute w-64 h-64 rounded-full bg-red-500 animate-pump-explode"></div>
                            <span className="text-8xl font-bebas text-white animate-pump-pop-text" style={{ textShadow: '0 0 15px white' }}>POP!</span>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none">
                     <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <path d="M150 100 L 150 70 C 150 50, 160 50, 170 50 L 230 50 C 240 50, 250 50, 250 70 L 250 100" fill="#1e293b" />
                        <path d="M130 100 L 270 100 L 280 80 L 120 80 Z" fill="#334155"/>
                        <circle cx="140" cy="85" r="3" fill="#ef4444" />
                        <circle cx="130" cy="85" r="2" fill="#475569" />
                        <circle cx="150" cy="85" r="2" fill="#475569" />
                    </svg>
                </div>
            </main>

            <footer className="shrink-0 bg-[#1e293b] p-4 border-t-2 border-slate-700/50 z-10">
                <div className="w-full max-w-3xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg flex-1 flex flex-col sm:flex-row items-end gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet Amount</label>
                            <div className="flex items-center bg-[#0f172a] rounded-md p-1">
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isConfigPhase} className="w-24 bg-transparent text-center font-bold text-lg outline-none disabled:cursor-not-allowed" />
                                <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                                <div className="flex flex-col gap-0.5">
                                    <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isConfigPhase} className="px-2 py-1 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#334155] rounded-sm text-xs font-bold">2x</button>
                                    <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isConfigPhase} className="px-2 py-1 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#334155] rounded-sm text-xs font-bold">1/2</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Difficulty</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} disabled={!isConfigPhase} className="w-full bg-[#0f172a] p-3 rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-red-500 h-[42px]">
                                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="w-full md:w-64 flex items-stretch gap-3">
                         {(gameState === 'busted' || gameState === 'cashed_out')
                            ? <button onClick={resetGame} className="w-full text-xl font-bold rounded-md bg-yellow-400 hover:bg-yellow-500 transition-colors text-black uppercase">Play Again</button>
                            : (
                                <>
                                 <button onClick={handlePump} disabled={!canBet || !canPumpMore && gameState==='playing'} className="w-full text-xl font-bold rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white uppercase disabled:bg-slate-700/50 disabled:cursor-not-allowed">
                                        {gameState === 'config' ? 'Bet' : 'Pump'}
                                    </button>
                                    <button onClick={handleCashout} disabled={gameState !== 'playing' || pumpCount === 0} className="w-full text-xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-black uppercase disabled:bg-green-500/50 disabled:cursor-not-allowed">Cashout</button>
                                </>
                            )
                        }
                    </div>
                </div>
            </footer>
            <PumpRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default PumpGame;