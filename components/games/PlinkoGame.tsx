import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext.tsx';
import useAnimatedBalance from '../../hooks/useAnimatedBalance.tsx';
import { useSound } from '../../hooks/useSound.ts';
import ArrowLeftIcon from '../icons/ArrowLeftIcon.tsx';
import GameRulesIcon from '../icons/GameRulesIcon.tsx';
import PlusIcon from '../icons/PlusIcon.tsx';
import MinusIcon from '../icons/MinusIcon.tsx';
import WinAnimation from '../WinAnimation.tsx';
import { PLINKO_PAYOUTS, PLINKO_RISKS, PLINKO_ROWS, PlinkoRiskLevel, PlinkoRows } from './plinko/payouts.ts';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;

const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 1) return '#64748b'; // slate-500
    if (multiplier < 2) return '#3b82f6'; // blue-500
    if (multiplier < 5) return '#a855f7'; // purple-500
    if (multiplier < 20) return '#ec4899'; // pink-500
    if (multiplier < 100) return '#ef4444'; // red-500
    return '#facc15'; // yellow-400
};

type Ball = {
    id: number;
    path: number[];
    animationName: string;
    animationDuration: number;
    multiplier: number;
    winAmount: number;
    endTarget: number;
};

const PlinkoGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(1.00);
    const [betInput, setBetInput] = useState('1.00');
    const [riskLevel, setRiskLevel] = useState<PlinkoRiskLevel>('Medium');
    const [rows, setRows] = useState<PlinkoRows>(12);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [animations, setAnimations] = useState<string>('');
    const [history, setHistory] = useState<{ multiplier: number }[]>([]);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
    const [landedSlots, setLandedSlots] = useState<Record<number, number>>({});

    const animatedBalance = useAnimatedBalance(user?.balance ?? 0);
    const { playSound } = useSound();
    const isMounted = useRef(true);
    const boardRef = useRef<HTMLDivElement>(null);
    const pegRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);
    useEffect(() => setBetInput(betAmount.toFixed(2)), [betAmount]);
    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const handleBet = useCallback(async () => {
        if (!user || betAmount > user.balance) return;
        await adjustBalance(-betAmount);

        const path = Array.from({ length: rows }, () => Math.round(Math.random()));
        const endTarget = path.reduce((sum, dir) => sum + dir, 0);
        const multipliers = PLINKO_PAYOUTS[riskLevel][rows];
        const multiplier = multipliers[endTarget];
        const winAmount = betAmount * multiplier;
        
        const ballId = Date.now() + Math.random();
        const animationName = `plinko-path-${ballId}`;
        const animationDuration = 100 + rows * 150;

        const boardRect = boardRef.current?.getBoundingClientRect();
        if (!boardRect) return;

        const PEG_SPACING_X = 48;
        const PEG_SPACING_Y = 48;
        const startX = boardRect.width / 2;

        let keyframes = `0% { transform: translate(${startX}px, 0px); }\n`;
        let currentX = startX;
        let soundTimeouts: ReturnType<typeof setTimeout>[] = [];

        path.forEach((direction, i) => {
            const stepProgress = ((i + 1) / (rows + 1)) * 100;
            currentX += (direction === 1 ? 0.5 : -0.5) * PEG_SPACING_X;
            const currentY = (i + 1) * PEG_SPACING_Y - 20;
            keyframes += `${stepProgress}% { transform: translate(${currentX}px, ${currentY}px); }\n`;
            
            const soundDelay = (animationDuration / (rows + 1)) * (i + 1);
            soundTimeouts.push(setTimeout(() => {
                playSound('plinko_hit');
                const pegEl = pegRefs.current[`${i}-${path.slice(0,i+1).reduce((s,d)=>s+d,0)}`];
                if(pegEl) {
                    pegEl.classList.add('hit');
                    setTimeout(() => pegEl.classList.remove('hit'), 150);
                }
            }, soundDelay));
        });
        
        const finalY = (rows + 1) * PEG_SPACING_Y - 20;
        keyframes += `100% { transform: translate(${currentX}px, ${finalY}px); opacity: 0; }\n`;

        setAnimations(prev => `${prev}@keyframes ${animationName} { ${keyframes} }\n`);
        
        const newBall: Ball = { id: ballId, path, animationName, animationDuration, multiplier, winAmount, endTarget };
        setBalls(prev => [...prev, newBall]);

        setTimeout(() => {
            if (!isMounted.current) return;
            adjustBalance(winAmount);
            
            const netWinnings = winAmount - betAmount;
            if (netWinnings > 0) {
                setWinData({ amount: netWinnings, key: ballId });
                playSound('win');
            } else if (multiplier < 1) {
                playSound('lose');
            } else { // multiplier is 1.0
                playSound('tick');
            }

            setHistory(prev => [{ multiplier }, ...prev].slice(0, 20));
            setLandedSlots(prev => ({...prev, [endTarget]: (prev[endTarget] || 0) + 1}));
            setTimeout(() => {
                if (!isMounted.current) return;
                setLandedSlots(prev => {
                    const currentCount = prev[endTarget] || 0;
                    if (currentCount <= 0) return prev;
                    return { ...prev, [endTarget]: currentCount - 1 };
                });
            }, 300);
            
            setBalls(prev => prev.filter(b => b.id !== ballId));
        }, animationDuration);

    }, [user, betAmount, rows, riskLevel, adjustBalance, playSound]);

    const pegs = useMemo(() => Array.from({ length: rows }, (_, i) => Array.from({ length: i + 1 })), [rows]);
    const multipliers = useMemo(() => PLINKO_PAYOUTS[riskLevel][rows], [riskLevel, rows]);
    const canBet = user && betAmount <= user.balance;

    return (
        <div className="bg-[#0f1124] h-screen flex flex-col font-poppins text-white select-none">
            <style>{animations}</style>
            {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
            <header className="flex items-center justify-between p-3 bg-[#1a1b2f]">
                <div className="flex-1"><button onClick={onBack}><ArrowLeftIcon className="w-6 h-6"/></button></div>
                <div className="flex-1 text-center text-xl font-bold uppercase text-purple-400">Plinko</div>
                <div className="flex-1 flex justify-end items-center bg-black/30 rounded-md px-4 py-1.5"><span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span></div>
            </header>
            
            <div className="w-full px-4 py-2">
                 <div className="plinko-history-bar">
                    {history.map((h, i) => <div key={i} className="plinko-history-item" style={{ backgroundColor: getMultiplierColor(h.multiplier) }}>{h.multiplier.toFixed(2)}x</div>)}
                </div>
            </div>

            <main ref={boardRef} className="flex-grow flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 md:scale-90 lg:scale-100">
                    <div className="plinko-board">
                        {pegs.map((row, i) => (
                            <div key={i} className="plinko-row">
                                {row.map((_, j) => <div key={j} ref={el => { pegRefs.current[`${i}-${j}`] = el; }} className="plinko-peg"/>)}
                            </div>
                        ))}
                        <div className="plinko-multiplier-row">
                            {multipliers.map((m, i) => <div key={i} className={`plinko-multiplier-box ${landedSlots[i] ? 'landed' : ''}`} style={{ color: getMultiplierColor(m), backgroundColor: `${getMultiplierColor(m)}20` }}>{m}x</div>)}
                        </div>
                    </div>
                </div>
                {balls.map(ball => <div key={ball.id} className="plinko-ball" style={{ backgroundColor: getMultiplierColor(ball.multiplier), animation: `${ball.animationName} ${ball.animationDuration}ms linear forwards` }}/>)}
            </main>

            <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
                <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Bet Amount</label>
                            <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                                <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} className="p-2"><MinusIcon className="w-4 h-4"/></button>
                                <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} className="w-24 bg-transparent text-center font-bold text-base outline-none"/>
                                <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} className="p-2"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-400 mb-1 block">Risk</label>
                             <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                                {PLINKO_RISKS.map(r => <button key={r} onClick={() => setRiskLevel(r)} className={`px-4 py-1.5 rounded text-sm font-semibold ${riskLevel === r ? 'bg-slate-600' : ''}`}>{r}</button>)}
                             </div>
                        </div>
                         <div>
                             <label className="text-xs text-gray-400 mb-1 block">Rows</label>
                             <select value={rows} onChange={e => setRows(Number(e.target.value) as PlinkoRows)} className="w-full bg-[#2f324d] p-2 rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 h-10">
                                {PLINKO_ROWS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="w-full sm:w-64">
                        <button onClick={handleBet} disabled={!canBet} className="w-full h-14 text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
                            Bet
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PlinkoGame;