

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import KenoRulesModal from './keno/KenoRulesModal';
import { PAYOUTS, type RiskLevel } from './keno/payouts';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const MAX_PROFIT = 10000.00;
const NUMBERS_COUNT = 40;
const DRAW_COUNT = 10;
const MAX_SELECTION = 10;
const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High'];

type GamePhase = 'betting' | 'drawing' | 'result';

const KenoGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState(betAmount.toFixed(2));
    const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
    const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');
    const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
    const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
    const [hits, setHits] = useState<Set<number>>(new Set());
    const [winnings, setWinnings] = useState<number | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [timer, setTimer] = useState(0);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const isMounted = useRef(true);
    const { playSound } = useSound();

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);
    
    useEffect(() => {
        setBetInput(betAmount.toFixed(2));
    }, [betAmount]);

    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBetInput(e.target.value);
    };

    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        else if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const handleNumberToggle = (num: number) => {
        if (gamePhase !== 'betting') return;
        playSound('click');
        const newSelection = new Set(selectedNumbers);
        if (newSelection.has(num)) {
            newSelection.delete(num);
        } else {
            if (newSelection.size < MAX_SELECTION) {
                newSelection.add(num);
            }
        }
        setSelectedNumbers(newSelection);
    };

    const handleAutoPick = () => {
        if (gamePhase !== 'betting') return;
        playSound('click');
        const availableNumbers = Array.from({ length: NUMBERS_COUNT }, (_, i) => i + 1);
        const newSelection = new Set<number>();
        while (newSelection.size < MAX_SELECTION && availableNumbers.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            newSelection.add(availableNumbers.splice(randomIndex, 1)[0]);
        }
        setSelectedNumbers(newSelection);
    };

    const handleClear = () => {
        if (gamePhase !== 'betting') return;
        playSound('click');
        setSelectedNumbers(new Set());
    };

    const handleRiskChange = (direction: 'next' | 'prev') => {
        if (gamePhase !== 'betting') return;
        playSound('click');
        const currentIndex = RISK_LEVELS.indexOf(riskLevel);
        const nextIndex = direction === 'next'
            ? (currentIndex + 1) % RISK_LEVELS.length
            : (currentIndex - 1 + RISK_LEVELS.length) % RISK_LEVELS.length;
        setRiskLevel(RISK_LEVELS[nextIndex]);
    };

    const handleBet = async () => {
        if (!profile || gamePhase !== 'betting' || selectedNumbers.size === 0 || betAmount > profile.balance) return;

        playSound('bet');
        await adjustBalance(-betAmount);
        if (!isMounted.current) return;

        setGamePhase('drawing');
        setDrawnNumbers(new Set());
        setHits(new Set());
        setWinnings(null);

        const allNumbers = Array.from({ length: NUMBERS_COUNT }, (_, i) => i + 1);
        const numbersToDraw: number[] = [];
        for (let i = 0; i < DRAW_COUNT; i++) {
            const randomIndex = Math.floor(Math.random() * allNumbers.length);
            numbersToDraw.push(allNumbers.splice(randomIndex, 1)[0]);
        }
        
        for (const [index, num] of numbersToDraw.entries()) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (!isMounted.current) return;
            playSound('tick');
            setDrawnNumbers(prev => new Set(prev).add(num));

            if (index === DRAW_COUNT - 1) {
                // Last number drawn, process results
                const finalHits = new Set([...selectedNumbers].filter(n => numbersToDraw.includes(n)));
                setHits(finalHits);

                const picksCount = selectedNumbers.size;
                const hitsCount = finalHits.size;
                const payoutTable = PAYOUTS[riskLevel][picksCount];
                const multiplier = payoutTable ? (payoutTable[hitsCount] || 0) : 0;
                const finalWinnings = betAmount * multiplier;
                
                if (finalWinnings > 0) {
                    const netWinnings = finalWinnings - betAmount;
                    if(netWinnings > 0) {
                      setWinData({ amount: netWinnings, key: Date.now() });
                    }
                    playSound('win');
                    await adjustBalance(finalWinnings);
                } else {
                    playSound('lose');
                }
                
                if (!isMounted.current) return;
                setWinnings(finalWinnings);
                setGamePhase('result');
                
                setTimeout(() => {
                    if (isMounted.current) {
                       setGamePhase('betting');
                       setDrawnNumbers(new Set());
                       setHits(new Set());
                    }
                }, 3000);
            }
        }
    };

    const getPayoutTable = useMemo(() => {
        const picksCount = selectedNumbers.size;
        if (picksCount === 0) return [];
        const table = PAYOUTS[riskLevel][picksCount] || {};
        return Object.entries(table)
            .map(([hits, multi]) => ({ hits: parseInt(hits), multi }))
            .filter(item => item.multi > 0) 
            .sort((a, b) => a.hits - b.hits);
    }, [selectedNumbers.size, riskLevel]);
    
    const getNumberClass = (num: number) => {
        const isSelected = selectedNumbers.has(num);
        const isDrawn = drawnNumbers.has(num);
        const isHit = hits.has(num);

        if (isHit) return 'bg-green-500/80 ring-2 ring-yellow-300 scale-110';
        if (isDrawn) return 'bg-yellow-500/70 scale-105';
        if (isSelected) return 'bg-purple-600/90 ring-2 ring-purple-400';
        return 'bg-slate-700/50 hover:bg-slate-600/50';
    };

    return (
        <div className="bg-[#0f1124] h-screen flex flex-col font-poppins text-white select-none">
            {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
            <header className="flex items-center justify-between p-3 bg-[#1a1b2f] shrink-0">
                <div className="flex-1 flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold uppercase text-blue-400">Keno</h1>
                </div>
                <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
                <div className="flex-1 flex justify-end items-center space-x-3 text-sm">
                    <span className="font-mono text-gray-400">{`00:00:${timer.toString().padStart(2, '0')}`}</span>
                    <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
                </div>
            </header>

            <main className="flex-grow p-4 flex flex-col items-center justify-center gap-4">
                <div className="w-full max-w-2xl">
                    <div className="grid grid-cols-10 gap-1 md:gap-2">
                        {Array.from({ length: NUMBERS_COUNT }, (_, i) => i + 1).map(num => (
                            <button
                                key={num}
                                onClick={() => handleNumberToggle(num)}
                                disabled={gamePhase !== 'betting'}
                                className={`aspect-square rounded-md flex items-center justify-center font-bold text-sm md:text-lg transition-all duration-200 ${getNumberClass(num)}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4 mt-4">
                        <button onClick={handleAutoPick} disabled={gamePhase !== 'betting'} className="px-8 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold disabled:opacity-50">Auto Pick</button>
                        <button onClick={handleClear} disabled={gamePhase !== 'betting'} className="px-8 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold disabled:opacity-50">Clean</button>
                    </div>

                    <div className="mt-4 min-h-[70px]">
                         <div className="flex justify-center items-center gap-1 md:gap-2 flex-wrap">
                            {getPayoutTable.map(({ hits, multi }) => (
                                <div key={hits} className="bg-slate-800/60 p-1 md:p-2 rounded-md text-center">
                                    <p className="text-xs text-gray-400">{hits} Hits</p>
                                    <p className={`font-bold text-sm md:text-base ${multi > 0 ? 'text-green-400' : 'text-gray-500'}`}>{multi.toFixed(2)}x</p>
                                </div>
                            ))}
                        </div>
                    </div>
                     <p className="text-center text-sm text-gray-400 mt-2">Select 1 - 10 numbers to play</p>
                </div>
            </main>

            <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
                <div className="w-full max-w-3xl mx-auto flex flex-col md:flex-row items-center md:items-stretch justify-between gap-4">
                     <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet</label>
                            <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                                <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><MinusIcon className="w-5 h-5"/></button>
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={gamePhase !== 'betting'} className="w-24 bg-transparent text-center font-bold text-lg outline-none disabled:cursor-not-allowed" />
                                <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                                <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Game Risk</label>
                            <div className="flex items-center justify-between bg-[#2f324d] rounded-md p-1 w-48 h-[44px]">
                                <button onClick={() => handleRiskChange('prev')} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronLeftIcon className="w-4 h-4"/></button>
                                <span className="font-bold text-base">{riskLevel}</span>
                                <button onClick={() => handleRiskChange('next')} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronRightIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-56 h-14 md:h-auto">
                        <button
                            onClick={handleBet}
                            disabled={gamePhase !== 'betting' || selectedNumbers.size === 0 || !profile || betAmount > profile.balance}
                            className="w-full h-full text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Bet
                        </button>
                    </div>
                </div>
            </footer>
            <KenoRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default KenoGame;