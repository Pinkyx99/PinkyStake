

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
import WheelRulesModal from './wheel/WheelRulesModal';
import { SEGMENT_CONFIG, MULTIPLIER_COLORS, type RiskLevel, type SegmentCount } from './wheel/payouts';

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
    
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
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

    const wheelStyle = useMemo(() => {
        const angle = 360 / segmentCount;
        const gradientStops = wheelSegments.map((segment, i) => 
            `${segment.color} ${i * angle}deg, ${segment.color} ${(i + 1) * angle}deg`
        ).join(', ');
        return {
            background: `conic-gradient(${gradientStops})`,
            transition: 'transform 7s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `rotate(${rotation}deg)`,
        };
    }, [segmentCount, wheelSegments, rotation]);

    const handleRiskChange = (direction: 'next' | 'prev') => {
        const currentIndex = RISK_LEVELS.indexOf(riskLevel);
        const newIndex = direction === 'next' ? (currentIndex + 1) % RISK_LEVELS.length : (currentIndex - 1 + RISK_LEVELS.length) % RISK_LEVELS.length;
        setRiskLevel(RISK_LEVELS[newIndex]);
    };

    const handleSegmentChange = (direction: 'next' | 'prev') => {
        const currentIndex = SEGMENT_COUNTS.indexOf(segmentCount);
        const newIndex = direction === 'next' ? (currentIndex + 1) % SEGMENT_COUNTS.length : (currentIndex - 1 + SEGMENT_COUNTS.length) % SEGMENT_COUNTS.length;
        setSegmentCount(SEGMENT_COUNTS[newIndex]);
    };

    const handleSpin = async () => {
        if (!profile || gamePhase !== 'betting' || betAmount > profile.balance) return;

        await adjustBalance(-betAmount);
        if (!isMounted.current) return;
        
        setGamePhase('spinning');
        setWinningMultiplier(null);
        
        const winningIndex = Math.floor(Math.random() * segmentCount);
        const winner = wheelSegments[winningIndex];
        
        const anglePerSegment = 360 / segmentCount;
        const targetAngle = -(winningIndex * anglePerSegment + anglePerSegment / 2);
        const randomOffset = Math.random() * (anglePerSegment * 0.8) - (anglePerSegment * 0.4);
        const fullSpins = 5 * 360;
        const finalRotation = rotation - (rotation % 360) + fullSpins + targetAngle + randomOffset;

        setRotation(finalRotation);

        setTimeout(async () => {
            if (!isMounted.current) return;
            setWinningMultiplier(winner.multiplier);
            setGamePhase('result');
            
            const winnings = betAmount * winner.multiplier;
            if (winnings > 0) {
                await adjustBalance(winnings);
            }

            setTimeout(() => {
                if (isMounted.current) setGamePhase('betting');
            }, 3000);
        }, 7500);
    };

    const displayedMultipliers = useMemo(() => {
        const uniqueMultipliers = [...new Set(wheelSegments.map(s => s.multiplier))].sort((a, b) => a - b);
        return uniqueMultipliers.map(m => ({ multiplier: m, color: MULTIPLIER_COLORS[m] || '#334155' }));
    }, [wheelSegments]);

    return (
        <div className="bg-[#1a1d3a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
            <header className="flex items-center justify-between p-3 bg-[#0f1124] shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold uppercase text-yellow-400">Wheel</h1>
                </div>
                <div className="flex items-center bg-black/30 rounded-md px-4 py-1.5">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
                </div>
            </header>
            
            <main className="flex-grow p-4 flex flex-col items-center justify-center gap-8 relative">
                <div className="relative w-[400px] h-[400px] flex items-center justify-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-10 bg-red-600 z-10" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                    <div className="absolute w-full h-full rounded-full border-[14px] border-slate-700/50 shadow-inner"></div>
                    <div style={wheelStyle} className="w-[370px] h-[370px] rounded-full shadow-2xl"></div>
                    <div className="absolute w-28 h-28 bg-slate-800 rounded-full border-4 border-slate-600 flex items-center justify-center">
                        {gamePhase === 'result' && winningMultiplier !== null && (
                            <span className="text-3xl font-bold animate-pulse" style={{ color: MULTIPLIER_COLORS[winningMultiplier] || '#ffffff' }}>{winningMultiplier.toFixed(2)}x</span>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 ml-2">Profit on Win</label>
                            <div className="bg-[#0f1124] rounded-md p-2 h-10 flex items-center justify-between px-3 border border-slate-700">
                                <span className="font-bold text-white">{profitOnWin.toFixed(2)}</span>
                                <span className="text-sm text-gray-500">EUR</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 ml-2">Chance</label>
                            <div className="bg-[#0f1124] rounded-md p-2 h-10 flex items-center justify-between px-3 border border-slate-700">
                                <span className="font-bold text-white">{chanceText}</span>
                                <span className="text-sm text-gray-500">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 w-full bg-[#1f2937] p-1 rounded-lg" onMouseLeave={() => setHoveredMultiplier(null)}>
                        {displayedMultipliers.map(({ multiplier, color }) => (
                            <div 
                                key={multiplier} 
                                className="relative flex-1"
                                onMouseEnter={() => setHoveredMultiplier(multiplier)}
                            >
                                {hoveredMultiplier === multiplier && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white mb-1"></div>
                                )}
                                <div 
                                    className="w-full p-2 rounded-md text-center transition-all duration-200"
                                    style={{
                                        backgroundColor: hoveredMultiplier === multiplier ? color : 'transparent'
                                    }}
                                >
                                    <span className="text-sm font-bold" style={{ color: hoveredMultiplier === multiplier && (color === '#f1f5f9' || color === '#ffffff') ? '#1f2937' : '#f1f5f9' }}>
                                        {multiplier.toFixed(2)}x
                                    </span>
                                    <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="shrink-0 bg-[#0f1124] p-4 border-t border-gray-700/50">
                <div className="w-full max-w-3xl mx-auto flex items-stretch justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet</label>
                            <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                                <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#404566] rounded-md"><MinusIcon className="w-5 h-5"/></button>
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={gamePhase !== 'betting'} className="w-24 bg-transparent text-center font-bold text-lg outline-none"/>
                                <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#404566] rounded-md"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div>
                                <label className="text-xs font-semibold text-gray-400 mb-1 block">Risk</label>
                                <div className="flex items-center justify-between bg-[#2f324d] rounded-md p-1 w-40 h-[44px]">
                                    <button onClick={() => handleRiskChange('prev')} disabled={gamePhase !== 'betting'} className="p-2"><ChevronLeftIcon className="w-4 h-4"/></button>
                                    <span className="font-bold">{riskLevel}</span>
                                    <button onClick={() => handleRiskChange('next')} disabled={gamePhase !== 'betting'} className="p-2"><ChevronRightIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 mb-1 block">Segments</label>
                                <div className="flex items-center justify-between bg-[#2f324d] rounded-md p-1 w-32 h-[44px]">
                                    <button onClick={() => handleSegmentChange('prev')} disabled={gamePhase !== 'betting'} className="p-2"><ChevronLeftIcon className="w-4 h-4"/></button>
                                    <span className="font-bold">{segmentCount}</span>
                                    <button onClick={() => handleSegmentChange('next')} disabled={gamePhase !== 'betting'} className="p-2"><ChevronRightIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-56">
                        <button onClick={handleSpin} disabled={gamePhase !== 'betting' || !profile || betAmount > profile.balance} className="w-full h-full text-2xl font-bold rounded-md bg-[#84cc16] hover:bg-[#a3e635] transition-colors text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
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