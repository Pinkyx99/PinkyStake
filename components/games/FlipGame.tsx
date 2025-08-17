


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import FlipRulesModal from './flip/FlipRulesModal';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
type Choice = 'heads' | 'tails';
type GameState = 'betting' | 'flipping' | 'won' | 'lost';

const HeadsIcon: React.FC<{ className?: string }> = ({ className }) => <svg viewBox="0 0 100 100" className={className}><text x="50" y="68" fontSize="60" textAnchor="middle" fill="currentColor" fontWeight="bold">H</text></svg>;
const TailsIcon: React.FC<{ className?: string }> = ({ className }) => <svg viewBox="0 0 100 100" className={className}><text x="50" y="68" fontSize="60" textAnchor="middle" fill="currentColor" fontWeight="bold">T</text></svg>;

const FlipGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState(betAmount.toFixed(2));
    const [choice, setChoice] = useState<Choice>('heads');
    const [gameState, setGameState] = useState<GameState>('betting');
    const [winnings, setWinnings] = useState(0);
    const [multiplier, setMultiplier] = useState(1.00);
    const [flipResult, setFlipResult] = useState<Choice | null>(null);
    const [history, setHistory] = useState<Choice[]>([]);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
    
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const isMounted = useRef(true);
    const coinInnerRef = useRef<HTMLDivElement>(null);
    const { playSound } = useSound();

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);
    useEffect(() => setBetInput(betAmount.toFixed(2)), [betAmount]);

    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const resetForNewBet = () => {
        setGameState('betting');
        setWinnings(0);
        setMultiplier(1.00);
        setFlipResult(null);
    };

    const handleBet = async () => {
        if (!profile || betAmount > profile.balance || gameState === 'flipping' || gameState === 'lost') return;

        const isFirstBet = gameState === 'betting';
        if (isFirstBet) {
            await adjustBalance(-betAmount);
            if (!isMounted.current) return;
        }

        playSound('flip_spin');
        setGameState('flipping');
        
        const result: Choice = Math.random() < 0.5 ? 'heads' : 'tails';
        setFlipResult(result);

        if (coinInnerRef.current) {
            const currentTransform = coinInnerRef.current.style.transform;
            const match = currentTransform.match(/rotateY\(([^d]*)deg\)/);
            const currentY = match ? parseFloat(match[1]) : 0;
            
            const spins = 5 * 360; // 5 full spins
            const resultAngle = result === 'tails' ? 180 : 0;
            
            // Ensure we spin forward and land on the correct face
            const targetRotation = Math.ceil(currentY / 360) * 360 + spins + resultAngle;
            
            coinInnerRef.current.style.transform = `rotateY(${targetRotation}deg)`;
        }

        setTimeout(() => {
            if (!isMounted.current) return;

            setHistory(h => [result, ...h].slice(0, 20));
            if (result === choice) {
                playSound('flip_win');
                const newMultiplier = isFirstBet ? 1.98 : multiplier * 1.98; // 99% RTP
                setMultiplier(newMultiplier);
                setWinnings(betAmount * newMultiplier);
                setGameState('won');
            } else {
                playSound('lose');
                setGameState('lost');
                setTimeout(() => { if(isMounted.current) resetForNewBet(); }, 2000);
            }
        }, 1200);
    };
    
    const handleCashout = async () => {
        if (gameState !== 'won') return;
        playSound('cashout');
        setWinData({ amount: winnings, key: Date.now() });
        await adjustBalance(winnings);
        if (!isMounted.current) return;
        resetForNewBet();
    };
    
    const canBet = profile && betAmount <= profile.balance;
    const isConfigPhase = gameState === 'betting';

    const actionButton = () => {
        if (gameState === 'lost') {
            return <button disabled className="w-full h-full text-2xl font-bold rounded-md bg-red-600 text-white uppercase">Lost</button>;
        }
        if (gameState === 'won') {
            return (
                <div className="flex items-stretch gap-3 w-full h-full">
                    <button onClick={handleCashout} className="flex-1 text-xl font-bold rounded-md bg-green-500 hover:bg-green-600 text-black uppercase">Cashout</button>
                    <button onClick={handleBet} className="flex-1 text-xl font-bold rounded-md bg-slate-600 hover:bg-slate-500 text-white uppercase">Flip Again</button>
                </div>
            );
        }
        return <button onClick={handleBet} disabled={!canBet || gameState === 'flipping'} className="w-full h-full text-2xl font-bold rounded-md bg-yellow-400 hover:bg-yellow-500 text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">Bet</button>;
    };

    return (
        <div className="bg-[#0f172a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
            {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
            <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
                <div className="flex-1 flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 flex justify-center bg-slate-900/50 backdrop-blur-sm rounded-md px-4 py-1.5 border border-slate-700/50">
                    <span className="text-lg font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
                 <div className="flex-1" />
            </header>

            <main className="flex-grow pt-20 pb-8 px-4 flex flex-col items-center justify-center relative">
                <div className="absolute top-16 left-4 right-4 flex justify-center items-center gap-1.5 overflow-x-auto pb-2 text-gray-500" style={{ scrollbarWidth: 'none' }}>
                    <span className="text-xs mr-2">History:</span>
                    {history.map((res, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${res === 'heads' ? 'bg-amber-400 text-amber-900' : 'bg-slate-400 text-slate-900'}`}>
                            {res === 'heads' ? 'H' : 'T'}
                        </div>
                    ))}
                </div>

                <div className="relative w-64 h-64" style={{ perspective: '1000px' }}>
                    <div ref={coinInnerRef} className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transition: 'transform 1.2s cubic-bezier(0.5, 0, 0.5, 1)' }}>
                        <div className="absolute w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900 shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
                            <HeadsIcon className="w-32 h-32" />
                        </div>
                        <div className="absolute w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900 shadow-2xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <TailsIcon className="w-32 h-32" />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {gameState === 'won' && <p className="text-2xl font-bold text-green-400">You Won! ({multiplier.toFixed(2)}x)</p>}
                    {gameState === 'lost' && <p className="text-2xl font-bold text-red-500">You Lost!</p>}
                </div>
            </main>

            <footer className="shrink-0 bg-[#1e293b] p-4 border-t-2 border-slate-700/50 z-10">
                <div className="w-full max-w-3xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
                    <div className="flex-1 bg-slate-800/50 p-3 rounded-lg flex flex-col sm:flex-row items-end gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet Amount</label>
                            <div className="flex items-center bg-[#0f172a] rounded-md p-1">
                                <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#334155] rounded-sm"><MinusIcon className="w-5 h-5"/></button>
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isConfigPhase} className="w-24 bg-transparent text-center font-bold text-lg outline-none disabled:cursor-not-allowed" />
                                <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#334155] rounded-sm"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div className="flex-grow flex items-center justify-center gap-4">
                            <button
                                onClick={() => setChoice('heads')}
                                disabled={!isConfigPhase}
                                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${choice === 'heads' ? 'border-amber-400 bg-amber-400/20' : 'border-transparent hover:bg-slate-700/50'}`}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900"><HeadsIcon className="w-8 h-8"/></div>
                                <span className="mt-2 font-bold text-sm">Heads</span>
                            </button>
                            <button
                                onClick={() => setChoice('tails')}
                                disabled={!isConfigPhase}
                                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${choice === 'tails' ? 'border-slate-400 bg-slate-400/20' : 'border-transparent hover:bg-slate-700/50'}`}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900"><TailsIcon className="w-8 h-8"/></div>
                                <span className="mt-2 font-bold text-sm">Tails</span>
                            </button>
                        </div>
                    </div>
                    <div className="w-full md:w-64">
                        {actionButton()}
                    </div>
                </div>
            </footer>
            <FlipRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default FlipGame;