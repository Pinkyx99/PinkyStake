
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PumpRulesModal from './pump/PumpRulesModal';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"


const MIN_BET = 0.20;
const MAX_BET = 1000.00;
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type GameState = 'config' | 'playing' | 'busted' | 'cashed_out';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const PUMP_DATA: Record<Difficulty, { m: number; wc: number }[]> = {
    Easy: [
        { m: 1.02, wc: 0.96 }, { m: 1.07, wc: 0.92 }, { m: 1.11, wc: 0.88 }, { m: 1.17, wc: 0.84 }, { m: 1.23, wc: 0.80 }, { m: 1.29, wc: 0.76 }, { m: 1.36, wc: 0.72 }, { m: 1.44, wc: 0.68 }, { m: 1.53, wc: 0.64 }, { m: 1.63, wc: 0.60 }, { m: 1.75, wc: 0.56 }, { m: 1.88, wc: 0.52 }, { m: 2.04, wc: 0.48 }, { m: 2.23, wc: 0.44 }, { m: 2.45, wc: 0.40 }, { m: 2.72, wc: 0.36 }, { m: 3.06, wc: 0.32 }, { m: 3.50, wc: 0.28 }, { m: 4.08, wc: 0.24 }, { m: 4.90, wc: 0.20 }, { m: 6.10, wc: 0.16 }, { m: 8.10, wc: 0.12 }, { m: 12.20, wc: 0.08 }, { m: 24.50, wc: 0.04 }
    ],
    Medium: [
        { m: 1.11, wc: 0.88 }, { m: 1.27, wc: 0.77 }, { m: 1.46, wc: 0.66956522 }, { m: 1.69, wc: 0.57826087 }, { m: 1.98, wc: 0.49565217 }, { m: 2.33, wc: 0.42130435 }, { m: 2.76, wc: 0.35478261 }, { m: 3.31, wc: 0.29565217 }, { m: 4.03, wc: 0.2434651 }, { m: 4.95, wc: 0.19782609 }, { m: 6.19, wc: 0.15826087 }, { m: 7.88, wc: 0.12434783 }, { m: 10.25, wc: 0.09565216 }, { m: 13.6, wc: 0.0717751 }, { m: 18, wc: 0.0512675 }, { m: 26.83, wc: 0.03652174 }, { m: 40.25, wc: 0.0243483 }, { m: 64.4, wc: 0.01521739 }, { m: 112, wc: 0.00869565 }, { m: 225.40, wc: 0.00434783 }, { m: 563.50, wc: 0.00173913 }, { m: 2254, wc: 0.000434738 }, { m: 5000, wc: 0.0002 }, { m: 10000, wc: 0.0001 }
    ],
    Hard: [
        { m: 1.23, wc: 0.80 }, { m: 1.55, wc: 0.63333333 }, { m: 1.98, wc: 0.49565217 }, { m: 2.56, wc: 0.383000395 }, { m: 3.36, wc: 0.29181254 }, { m: 4.48, wc: 0.218885940 }, { m: 6.08, wc: 0.16126482 }, { m: 8.41, wc: 0.11646904 }, { m: 11.92, wc: 0.08221344 }, { m: 17.34, wc: 0.05652174 }, { m: 26.01, wc: 0.03768116 }, { m: 40.46, wc: 0.02422360 }, { m: 65, wc: 0.01490683 }, { m: 112.70, wc: 0.00869575 }, { m: 206.60, wc: 0.00474308 }, { m: 413.23, wc: 0.00237541 }, { m: 929.77, wc: 0.00105402 }, { m: 2479.40, wc: 0.00039526 }, { m: 8677.90, wc: 0.00011293 }, { m: 52060, wc: 0.00001882 }, { m: 100000, wc: 0.00001 }, { m: 200000, wc: 0.000005 }, { m: 500000, wc: 0.000002 }, { m: 1000000, wc: 0.000001 }
    ]
};

const Balloon = ({ multiplier, scale, gameState }: { multiplier: number; scale: number, gameState: GameState }) => (
    <div
        className={`relative origin-bottom transition-transform duration-300 ease-out ${gameState === 'busted' ? 'opacity-0' : 'opacity-100'} ${gameState === 'cashed_out' ? 'animate-balloon-cashout' : 'animate-balloon-idle'}`}
        style={{ width: '120px', transform: `scale(${scale})`, '--idle-duration': `${2 + Math.random()}s`} as React.CSSProperties}
    >
        <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
            <defs>
                <radialGradient id="balloonGloss" cx="50%" cy="50%" r="50%" fx="65%" fy="35%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                </radialGradient>
            </defs>
            <path d="M50 0 C 95 0, 100 35, 100 60 C 100 85, 80 100, 50 100 C 20 100, 0 85, 0 60 C 0 35, 5 0, 50 0 Z" fill="#ef4444" />
            <path d="M50 0 C 95 0, 100 35, 100 60 C 100 85, 80 100, 50 100 C 20 100, 0 85, 0 60 C 0 35, 5 0, 50 0 Z" fill="url(#balloonGloss)" />
            <path d="M48 98 Q 50 102 52 98 L 50 110 Z" fill="#dc2626" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-4">
            <span className="text-2xl text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {multiplier.toFixed(2)}x
            </span>
        </div>
    </div>
);

const Pump = ({ pumping }: { pumping: boolean }) => (
    <div className={`relative w-24 h-12 flex justify-center items-end ${pumping ? 'animate-pump-press' : ''}`}>
        <div className="absolute w-20 h-4 bg-slate-600 rounded-sm bottom-0"></div>
        <div className="absolute w-6 h-10 bg-slate-700 rounded-t-md bottom-4"></div>
        <div className="absolute w-16 h-4 bg-slate-500 rounded-sm bottom-10"></div>
    </div>
);

const MultiplierHistoryBar = ({ history }: { history: { multiplier: number; busted: boolean }[] }) => (
    <div className="absolute top-0 left-0 right-0 p-3 z-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {history.map((item, index) => (
                <div key={index} className={`bg-slate-800/60 px-3 py-1 rounded text-sm font-semibold shrink-0 ${item.busted ? 'text-red-500' : 'text-gray-300'}`}>
                    {item.multiplier.toFixed(2)}x
                </div>
            ))}
        </div>
    </div>
);

const PumpGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState(betAmount.toFixed(2));
    const [difficulty, setDifficulty] = useState<Difficulty>('Hard');
    const [gameState, setGameState] = useState<GameState>('config');
    const [multiplier, setMultiplier] = useState(1.00);
    const [pumpCount, setPumpCount] = useState(0);
    const [isPumping, setIsPumping] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
    const [history, setHistory] = useState([
        { multiplier: 1.23, busted: false }, { multiplier: 1.55, busted: false }, { multiplier: 1.98, busted: false }, { multiplier: 2.56, busted: false }, { multiplier: 3.36, busted: false }, { multiplier: 4.48, busted: false }, { multiplier: 6.08, busted: false }, { multiplier: 8.41, busted: true }, { multiplier: 11.92, busted: false }, { multiplier: 17.34, busted: false },
    ].reverse());

    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const isMounted = useRef(true);
    const { playSound } = useSound();
    
    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);
    useEffect(() => setBetInput(betAmount.toFixed(2)), [betAmount]);

    const balloonScale = useMemo(() => {
        const baseScale = 1.0;
        if (gameState === 'config') return baseScale;
        const growthFactor = Math.log(multiplier) * 0.15;
        return baseScale + growthFactor;
    }, [multiplier, gameState]);

    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const handlePrimaryAction = useCallback(async () => {
        if (gameState === 'busted' || gameState === 'cashed_out') {
            playSound('click');
            setGameState('config');
            setMultiplier(1.00);
            setPumpCount(0);
            return;
        }

        if (gameState === 'playing' && isPumping) return;

        const currentDifficultyData = PUMP_DATA[difficulty];
        if (pumpCount >= currentDifficultyData.length && gameState === 'playing') return;
        
        const isFirstPump = gameState === 'config';
        if (isFirstPump) {
            if (!profile || betAmount > profile.balance) return;
            playSound('bet');
            await adjustBalance(-betAmount);
            if (!isMounted.current) return;
            setGameState('playing');
        } else { // It's a subsequent pump
             setIsPumping(true);
             playSound('pump');

             setTimeout(() => {
                if (!isMounted.current) return;
                
                const pumpData = currentDifficultyData[pumpCount];
                const popChance = 1 - pumpData.wc;

                if (Math.random() < popChance) {
                    playSound('pop');
                    const bustMultiplier = pumpCount > 0 ? currentDifficultyData[pumpCount - 1].m : 1.00;
                    setHistory(h => [{ multiplier: bustMultiplier, busted: true }, ...h].slice(0, 20));
                    setGameState('busted');
                } else {
                    setPumpCount(p => p + 1);
                    setMultiplier(pumpData.m);
                }
                setIsPumping(false);
             }, 200);
        }
    }, [gameState, isPumping, difficulty, pumpCount, betAmount, profile, adjustBalance, playSound]);
    
    const handleCashout = async () => {
        if (gameState !== 'playing' || pumpCount === 0 || isPumping) return;
        
        playSound('cashout');
        const winnings = betAmount * multiplier;
        const netWinnings = winnings - betAmount;
        if(netWinnings > 0) {
           setWinData({ amount: netWinnings, key: Date.now() });
        }
        setHistory(h => [{ multiplier: multiplier, busted: false }, ...h].slice(0, 20));
        await adjustBalance(winnings);

        if (!isMounted.current) return;
        setGameState('cashed_out');
    };
    
    const primaryButtonText = useMemo(() => {
        if (gameState === 'config') return 'Bet';
        if (gameState === 'playing') return 'Pump';
        return 'Bet Again';
    }, [gameState]);

    const canBet = profile && betAmount <= profile.balance;
    const isConfigPhase = gameState === 'config';
    const canPumpMore = gameState === 'playing' && pumpCount < PUMP_DATA[difficulty].length;

    return (
        <div className="bg-[#1a1d3a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
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

            <MultiplierHistoryBar history={history} />
            
            <main className="flex-grow w-full relative flex flex-col items-center justify-center overflow-hidden pt-12">
                <div className="flex flex-col items-center justify-center">
                    <Balloon multiplier={multiplier} scale={balloonScale} gameState={gameState} />
                    <Pump pumping={isPumping} />
                </div>

                {gameState === 'busted' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute w-64 h-64 rounded-full bg-red-500/80 animate-pump-explode"></div>
                        <span className="text-8xl font-bebas text-white animate-pump-pop-text" style={{ textShadow: '0 0 15px white' }}>POP!</span>
                    </div>
                )}
            </main>

            <footer className="shrink-0 bg-[#0f172a] p-3 border-t-2 border-slate-800 z-10">
                <div className="w-full max-w-4xl mx-auto flex items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                       <div>
                         <Label htmlFor="bet-amount" className="text-gray-400 text-xs mb-1">Bet Amount</Label>
                         <div className="flex items-center bg-[#2f324d] rounded-md h-12">
                            <Input id="bet-amount" type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isConfigPhase} className="w-24 bg-transparent border-0 text-center font-bold text-lg focus-visible:ring-0" />
                            <span className="text-gray-500 pr-2 font-semibold">EUR</span>
                            <div className="flex flex-col gap-0.5 pr-1">
                                <Button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isConfigPhase} size="sm" className="h-5 px-2 bg-slate-600 hover:bg-slate-500">2x</Button>
                                <Button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isConfigPhase} size="sm" className="h-5 px-2 bg-slate-600 hover:bg-slate-500">1/2</Button>
                            </div>
                         </div>
                       </div>
                       <div>
                         <Label htmlFor="difficulty" className="text-gray-400 text-xs mb-1">Difficulty</Label>
                         <Select value={difficulty} onValueChange={(v: Difficulty) => setDifficulty(v)} disabled={!isConfigPhase}>
                            <SelectTrigger id="difficulty" className="w-36 bg-[#2f324d] border-0 h-12 font-bold focus:ring-0">
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2f324d] text-white border-slate-600">
                                {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="font-semibold">{d}</SelectItem>)}
                            </SelectContent>
                         </Select>
                       </div>
                    </div>
                    <div className="flex items-stretch gap-4">
                        <Button
                            onClick={handlePrimaryAction}
                            disabled={!canBet || isPumping || (!isConfigPhase && !canPumpMore && gameState !== 'busted' && gameState !== 'cashed_out')}
                            className="w-40 h-12 text-lg font-bold bg-slate-700 hover:bg-slate-600"
                        >
                           {primaryButtonText}
                        </Button>
                        <Button
                            onClick={handleCashout}
                            disabled={gameState !== 'playing' || pumpCount === 0 || isPumping}
                            className="w-40 h-12 text-lg font-bold bg-green-600 hover:bg-green-500 text-black"
                        >
                            Cashout
                        </Button>
                    </div>
                </div>
            </footer>
             <PumpRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default PumpGame;
