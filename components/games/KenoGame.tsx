





import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext.tsx';
import useAnimatedBalance from '../../hooks/useAnimatedBalance.tsx';
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
const NUMBERS_COUNT = 40;
const DRAW_COUNT = 10;
const MAX_SELECTION = 10;
const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High'];

type GamePhase = 'betting' | 'drawing' | 'result';

const KenoGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user, adjustBalance } = useUser();
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

    const animatedBalance = useAnimatedBalance(user?.balance ?? 0);
    const isMounted = useRef(true);
    const finalDrawRef = useRef<Set<number>>(new Set());
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
    
    const handleBet = useCallback(async () => {
        if (!user || betAmount > user.balance || selectedNumbers.size === 0 || gamePhase !== 'betting') return;
        
        playSound('bet');
        await adjustBalance(-betAmount);
        if (!isMounted.current) return;
        
        setGamePhase('drawing');
        setDrawnNumbers(new Set());
        setHits(new Set());
        setWinnings(null);
        
        const allNumbers = Array.from({ length: NUMBERS_COUNT }, (_, i) => i + 1);
        const shuffled = allNumbers.sort(() => 0.5 - Math.random());
        finalDrawRef.current = new Set(shuffled.slice(0, DRAW_COUNT));

        for (let i = 0; i < DRAW_COUNT; i++) {
            const drawTimeout = setTimeout(() => {
                if (!isMounted.current) return;
                const drawnNumber = Array.from(finalDrawRef.current)[i];
                setDrawnNumbers(prev => new Set(prev).add(drawnNumber));
                if (selectedNumbers.has(drawnNumber)) {
                    playSound('reveal');
                    setHits(prev => new Set(prev).add(drawnNumber));
                } else {
                    playSound('tick');
                }
            }, i * 300);
        }
        
        const resultTimeout = setTimeout(async () => {
            if (!isMounted.current) return;
            
            const hitCount = Array.from(finalDrawRef.current).filter(n => selectedNumbers.has(n)).length;
            const payoutTable = PAYOUTS[riskLevel][selectedNumbers.size];
            const multiplier = payoutTable?.[hitCount] || 0;
            const totalWinnings = betAmount * multiplier;
            
            setWinnings(totalWinnings);

            if (totalWinnings > 0) {
                playSound('win');
                setWinData({ amount: totalWinnings - betAmount, key: Date.now() });
                await adjustBalance(totalWinnings);
            } else {
                playSound('lose');
            }
            if (isMounted.current) setGamePhase('result');

        }, DRAW_COUNT * 300 + 500);

    }, [user, betAmount, selectedNumbers, riskLevel, adjustBalance, playSound, gamePhase]);

    const handlePlayAgain = () => {
        setGamePhase('betting');
        setDrawnNumbers(new Set());
        setHits(new Set());
        setWinnings(null);
    };

    const isBettingPhase = gamePhase === 'betting';

    return (
        <div className="bg-slate-900 min-h-screen flex flex-col font-poppins text-white select-none">
            {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
            <header className="flex items-center justify-between p-3 bg-[#1a1b2f]">
                <div className="flex-1 flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold uppercase text-blue-400">Keno</h1>
                </div>
                <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5">
                    <span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
                <div className="flex-1 flex justify-end items-center space-x-4">
                    <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white flex items-center gap-1"><GameRulesIcon className="w-5 h-5" /> Rules</button>
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
                <div className="w-full lg:w-72 shrink-0 bg-[#1a1b2f] rounded-lg p-4 flex flex-col gap-4 order-last lg:order-first">
                    <h3 className="text-lg font-bold text-center">Payouts</h3>
                    <div className="flex-grow overflow-y-auto space-y-1 text-xs pr-2">
                        {selectedNumbers.size > 0 && PAYOUTS[riskLevel][selectedNumbers.size] && Object.entries(PAYOUTS[riskLevel][selectedNumbers.size]).map(([hitCount, multiplier]) => (
                            <div key={hitCount} className={`flex justify-between p-1.5 rounded ${Number(hitCount) === hits.size && gamePhase !== 'betting' ? 'bg-yellow-500/20' : 'bg-slate-800/50'}`}>
                                <span className="font-semibold text-gray-300">Hits: {hitCount}</span>
                                <span className="font-bold text-yellow-400">{multiplier.toFixed(2)}x</span>
                            </div>
                        )).reverse()}
                    </div>
                </div>
                <div className="flex-grow flex items-center justify-center bg-[#1a1b2f] rounded-lg p-4">
                     <div className="grid grid-cols-8 gap-2 w-full max-w-2xl">
                        {Array.from({ length: NUMBERS_COUNT }, (_, i) => i + 1).map(num => {
                            const isSelected = selectedNumbers.has(num);
                            const isDrawn = drawnNumbers.has(num);
                            const isHit = hits.has(num);
                            let bgClass = 'bg-slate-700 hover:bg-slate-600';
                            if (isSelected) bgClass = 'bg-blue-600 hover:bg-blue-500';
                            if (isDrawn) bgClass = 'bg-slate-500';
                            if (isHit) bgClass = 'bg-green-500';

                            return (
                                <button
                                    key={num}
                                    onClick={() => handleNumberToggle(num)}
                                    disabled={!isBettingPhase}
                                    className={`keno-number ${bgClass} ${gamePhase === 'drawing' && isDrawn ? 'animate-keno-draw' : ''} ${isHit ? '!bg-green-500 animate-keno-hit' : ''}`}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
                 <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Bet</label>
                            <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                                <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><MinusIcon className="w-4 h-4"/></button>
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isBettingPhase} className="w-24 bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                                <span className="text-gray-500 pr-2 font-semibold">EUR</span>
                                <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">Risk</label>
                            <div className="flex items-center bg-[#2f324d] rounded-md p-1 w-40">
                                <button onClick={() => setRiskLevel(RISK_LEVELS[(RISK_LEVELS.indexOf(riskLevel) - 1 + 3) % 3])} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><ChevronLeftIcon className="w-3 h-3"/></button>
                                <span className="w-full text-center font-bold">{riskLevel}</span>
                                <button onClick={() => setRiskLevel(RISK_LEVELS[(RISK_LEVELS.indexOf(riskLevel) + 1) % 3])} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><ChevronRightIcon className="w-3 h-3"/></button>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <button onClick={handleAutoPick} disabled={!isBettingPhase} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold disabled:opacity-50">Auto Pick</button>
                        <button onClick={handleClear} disabled={!isBettingPhase} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold disabled:opacity-50">Clear</button>
                     </div>
                     <div className="w-full md:w-64">
                        {gamePhase === 'result' ? (
                            <button onClick={handlePlayAgain} className="w-full h-14 text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 text-white uppercase">Play Again</button>
                        ) : (
                            <button onClick={handleBet} disabled={!isBettingPhase || selectedNumbers.size === 0 || !user || betAmount > user.balance} className="w-full h-14 text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
                                Bet
                            </button>
                        )}
                    </div>
                 </div>
            </footer>
            <KenoRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default KenoGame;