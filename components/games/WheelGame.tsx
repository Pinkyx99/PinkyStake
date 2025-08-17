


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import WheelRulesModal from './wheel/WheelRulesModal';
import { SEGMENT_CONFIG, MULTIPLIER_COLORS, type RiskLevel, type SegmentCount } from './wheel/payouts';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const MAX_PROFIT = 10000.00;
const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High'];
const SEGMENT_COUNTS: SegmentCount[] = [10, 20, 30, 40, 50];

type GamePhase = 'betting' | 'spinning' | 'result';

const WheelGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState(betAmount.toFixed(2));
    const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');
    const [segmentCount, setSegmentCount] = useState<SegmentCount>(30);
    const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
    const [winningMultiplier, setWinningMultiplier] = useState<number | null>(null);
    const [rotation, setRotation] = useState(0);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(null);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
    
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const isMounted = useRef(true);
    const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { playSound } = useSound();

    useEffect(() => {
        isMounted.current = true;
        return () => { 
            isMounted.current = false;
            if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        setBetInput(betAmount.toFixed(2));
    }, [betAmount]);

    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        else if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };
    
    const wheelSegments = useMemo(() => {
        const multipliers = SEGMENT_CONFIG[riskLevel][segmentCount];
        return multipliers.map(m => ({ multiplier: m, color: MULTIPLIER_COLORS[m] || '#334155' }));
    }, [riskLevel, segmentCount]);

    const { profitOnWin, chanceText } = useMemo(() => {
        const targetMultiplier = hoveredMultiplier ?? 0;
        
        const profit = betAmount * targetMultiplier;
        const count = wheelSegments.filter(s => s.multiplier === targetMultiplier).length;
        const chance = `${count}/${segmentCount}`;

        return {
            profitOnWin: profit,
            chanceText: chance,
        };
    }, [hoveredMultiplier, betAmount, wheelSegments, segmentCount]);
    
    const wheelStyle = useMemo(() => ({
        transform: `rotate(${rotation}deg)`,
        transition: gamePhase === 'spinning' ? 'transform 7s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
    }), [rotation, gamePhase]);

    const handleSpin = useCallback(async () => {
        if (!profile || betAmount > profile.balance || gamePhase !== 'betting') return;

        playSound('bet');
        await adjustBalance(-betAmount);
        if (!isMounted.current) return;

        setGamePhase('spinning');
        
        // Decelerating sound effect
        if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
        const spinDuration = 7000;
        const startTime = performance.now();
        const playTickingSound = () => {
            const elapsedTime = performance.now() - startTime;
            if (elapsedTime >= spinDuration || !isMounted.current) {
                if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
                return;
            }
            playSound('spin_tick');
            const progress = elapsedTime / spinDuration;
            const easeOutQuad = (t: number) => t * (2 - t);
            const easedProgress = easeOutQuad(progress);
            const minInterval = 80;
            const maxInterval = 500;
            const nextInterval = minInterval + (maxInterval - minInterval) * easedProgress;
            soundTimeoutRef.current = setTimeout(playTickingSound, nextInterval);
        };
        playTickingSound();

        const winningIndex = Math.floor(Math.random() * segmentCount);
        const winner = wheelSegments[winningIndex].multiplier;
        
        const anglePerSegment = 360 / segmentCount;
        const targetAngle = -(winningIndex * anglePerSegment);
        const randomOffset = (Math.random() - 0.5) * anglePerSegment * 0.9;
        const fullSpins = 6 * 360;
        const finalRotation = rotation - (rotation % 360) + fullSpins + targetAngle + randomOffset;
        
        setRotation(finalRotation);

        setTimeout(async () => {
            if (!isMounted.current) return;
            if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
            setWinningMultiplier(winner);
            
            const winnings = betAmount * winner;
            if (winnings > 0) {
                const netWinnings = winnings - betAmount;
                if(netWinnings > 0){
                   setWinData({ amount: netWinnings, key: Date.now() });
                }
                playSound('win');
                await adjustBalance(winnings);
            } else {
                playSound('lose');
            }
            
            if (!isMounted.current) return;
            setGamePhase('result');

            setTimeout(() => {
                if (isMounted.current) {
                    setGamePhase('betting');
                    setWinningMultiplier(null);
                }
            }, 3000);

        }, 7000);
    }, [profile, betAmount, gamePhase, segmentCount, wheelSegments, rotation, adjustBalance, playSound]);
    
    return (
        <div className="bg-[#0f172a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
             {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
            <header className="flex items-center justify-between p-3 bg-[#1e293b] shrink-0 z-10">
                 <div className="flex-1 flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold uppercase text-yellow-400">Wheel</h1>
                </div>
                 <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
                <div className="flex-1 flex justify-end items-center space-x-3 text-sm">
                    <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
                </div>
            </header>
            
            <main className="flex-grow p-4 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-[12px] border-t-yellow-400 z-20 shadow-lg"></div>
                    <div className="relative w-[450px] h-[450px] rounded-full border-8 border-slate-700 bg-slate-800 shadow-2xl">
                        <div className="absolute w-full h-full" style={wheelStyle}>
                            {wheelSegments.map((segment, i) => {
                                const angle = (360 / segmentCount);
                                return (
                                    <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${angle * i}deg)`}}>
                                        <div
                                            className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom transition-all duration-200"
                                            style={{ 
                                                backgroundColor: segment.color, 
                                                width: `${Math.tan(Math.PI / segmentCount) * 450}px`,
                                                height: '225px',
                                                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                                                transform: (hoveredMultiplier === segment.multiplier && gamePhase === 'betting') ? 'scale(1.05)' : 'scale(1)'
                                            }}
                                            onMouseEnter={() => gamePhase === 'betting' && setHoveredMultiplier(segment.multiplier)}
                                            onMouseLeave={() => gamePhase === 'betting' && setHoveredMultiplier(null)}
                                        >
                                            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-black mix-blend-overlay" style={{ transform: 'rotate(0.5turn)' }}>{segment.multiplier}x</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                         <div className="absolute inset-1/4 rounded-full bg-slate-700 border-4 border-slate-600 flex flex-col items-center justify-center text-center p-2">
                            {gamePhase === 'result' && winningMultiplier !== null ? (
                                <>
                                    <p className="text-xs text-gray-400">You Won</p>
                                    <p className="text-4xl font-bold" style={{ color: MULTIPLIER_COLORS[winningMultiplier] || 'white' }}>{winningMultiplier}x</p>
                                </>
                            ) : gamePhase === 'betting' && hoveredMultiplier !== null ? (
                                 <>
                                    <p className="text-xs text-gray-400">Profit on Win</p>
                                    <p className="text-2xl font-bold text-green-400">{profitOnWin.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400 mt-1">Chance: {chanceText}</p>
                                 </>
                            ) : (
                                <p className="text-2xl font-bold text-gray-400">Spin!</p>
                            )}
                         </div>
                    </div>
                </div>
            </main>

            <footer className="shrink-0 bg-[#1e293b] p-4 border-t-2 border-slate-700/50">
                <div className="w-full max-w-4xl mx-auto flex items-stretch justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet Amount</label>
                            <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                                <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><MinusIcon className="w-5 h-5"/></button>
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={gamePhase !== 'betting'} className="w-24 bg-transparent text-center font-bold text-lg outline-none disabled:cursor-not-allowed" />
                                <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                                <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Game Risk</label>
                            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as RiskLevel)} disabled={gamePhase !== 'betting'} className="w-full bg-[#2f324d] p-3 rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 h-[44px]">
                                {RISK_LEVELS.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Segments</label>
                            <select value={segmentCount} onChange={e => setSegmentCount(Number(e.target.value) as SegmentCount)} disabled={gamePhase !== 'betting'} className="w-full bg-[#2f324d] p-3 rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 h-[44px]">
                                {SEGMENT_COUNTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="w-64">
                        <button
                            onClick={handleSpin}
                            disabled={gamePhase !== 'betting' || !profile || betAmount > profile.balance}
                            className="w-full h-full text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Bet
                        </button>
                    </div>
                </div>
            </footer>
            <WheelRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default WheelGame;