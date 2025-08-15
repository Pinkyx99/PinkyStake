

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const WAITING_TIME = 5000; // 5s

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 400;
const MAX_TIME_ON_GRAPH = 12000; // 12s

const INITIAL_Y_AXIS_MAX = 2.5;
const Y_AXIS_VISIBLE_RANGE = INITIAL_Y_AXIS_MAX - 1.0;

type GamePhase = 'waiting' | 'running' | 'crashed';
type BetState = {
  amount: number;
  input: string;
  isPlaced: boolean;
  hasCollected: boolean;
  autoCollect: boolean;
  collectAt: number;
  collectInput: string;
};

const initialBetState = (amount: number, collectAt: number): BetState => ({
  amount,
  input: amount.toFixed(2),
  isPlaced: false,
  hasCollected: false,
  autoCollect: false,
  collectAt,
  collectInput: collectAt.toFixed(2),
});

const BetPanel: React.FC<{
    betState: BetState;
    onBetStateChange: (newState: Partial<BetState>) => void;
    onPlaceBet: () => void;
    onCollect: () => void;
    gamePhase: GamePhase;
    canBet: boolean;
}> = ({ betState, onBetStateChange, onPlaceBet, onCollect, gamePhase, canBet }) => {
    
    const isBettingPhase = gamePhase === 'waiting';
    const isRunningWithBet = gamePhase === 'running' && betState.isPlaced && !betState.hasCollected;

    const handleAmountBlur = () => {
        let value = parseFloat(betState.input);
        if (isNaN(value) || value < MIN_BET) {
            value = MIN_BET;
        } else if (value > MAX_BET) {
            value = MAX_BET;
        }
        onBetStateChange({ amount: value, input: value.toFixed(2) });
    };

    const handleCollectAtBlur = () => {
        let value = parseFloat(betState.collectInput);
        if (isNaN(value) || value < 1.01) {
            value = 1.01;
        }
        onBetStateChange({ collectAt: value, collectInput: value.toFixed(2) });
    };

    const actionButton = () => {
        if (isRunningWithBet) {
             return <button onClick={() => onCollect()} className="w-full h-full text-xl font-bold rounded-md bg-purple-500 hover:bg-purple-600 transition-colors text-white uppercase">Cashout</button>;
        }
        if (betState.isPlaced && isBettingPhase) {
             return <button onClick={onPlaceBet} className="w-full h-full text-xl font-bold rounded-md bg-red-500 hover:bg-red-600 transition-colors text-white uppercase">Cancel</button>;
        }
        return <button onClick={onPlaceBet} disabled={!canBet} className={`w-full h-full text-xl font-bold rounded-md transition-colors text-black uppercase bg-green-400 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed`}>Bet</button>;
    };

    return (
        <div className="bg-slate-800/50 p-3 rounded-lg flex-1 flex flex-col gap-3">
            <div className="flex items-center bg-slate-900/70 rounded-md p-1">
                <button onClick={() => onBetStateChange({ amount: Math.max(MIN_BET, betState.amount / 2)})} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-slate-700 rounded"><MinusIcon className="w-4 h-4"/></button>
                <input type="text" value={betState.input} onChange={e => onBetStateChange({ input: e.target.value })} onBlur={handleAmountBlur} disabled={!isBettingPhase} className="flex-grow w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                <button onClick={() => onBetStateChange({ amount: Math.min(MAX_BET, betState.amount * 2)})} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-slate-700 rounded"><PlusIcon className="w-4 h-4"/></button>
            </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900/70 rounded-md p-1 flex-grow">
                     <input type="text" placeholder="Auto Cashout" value={betState.collectInput} onChange={e => onBetStateChange({ collectInput: e.target.value })} onBlur={handleCollectAtBlur} disabled={!isBettingPhase} className="flex-grow w-full bg-transparent text-center font-bold text-sm outline-none disabled:cursor-not-allowed" />
                     <span className="text-gray-400 pr-2">x</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="switch">
                        <input type="checkbox" checked={betState.autoCollect} onChange={e => onBetStateChange({ autoCollect: e.target.checked })} disabled={!isBettingPhase} />
                        <span className="slider"></span>
                    </label>
                    <span className="text-xs text-gray-400 font-bold">AUTO</span>
                </div>
            </div>
            <div className="h-14 mt-auto">
                {actionButton()}
            </div>
        </div>
    );
};

const CrashGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [phase, setPhase] = useState<GamePhase>('waiting');
    const [countdown, setCountdown] = useState(WAITING_TIME / 1000);
    const [multiplier, setMultiplier] = useState(1.00);
    const [graphPoints, setGraphPoints] = useState<[number, number][]>([[0, 1]]);
    const [yAxisBounds, setYAxisBounds] = useState({ min: 1.0, max: INITIAL_Y_AXIS_MAX });
    
    const [bet1, setBet1] = useState(() => initialBetState(5.00, 2.00));
    const [bet2, setBet2] = useState(() => initialBetState(10.00, 5.00));
    
    const bet1Ref = useRef(bet1); bet1Ref.current = bet1;
    const bet2Ref = useRef(bet2); bet2Ref.current = bet2;

    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const gameLoopRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>();
    const isMounted = useRef(true);

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

    const handleCollect = useCallback(async (panel: 1 | 2, collectMultiplier: number) => {
        const stateUpdater = panel === 1 ? setBet1 : setBet2;
        const betState = panel === 1 ? bet1Ref.current : bet2Ref.current;
        
        if (betState.isPlaced && !betState.hasCollected) {
            stateUpdater(b => ({ ...b, hasCollected: true }));
            const winnings = betState.amount * collectMultiplier;
            await adjustBalance(winnings);
        }
    }, [adjustBalance]);
    
    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout> | undefined;
        let intervalId: ReturnType<typeof setInterval> | undefined;

        if (phase === 'waiting') {
            setMultiplier(1.00);
            setGraphPoints([[0, 1]]);
            setYAxisBounds({ min: 1.0, max: INITIAL_Y_AXIS_MAX });
            // This logic is tricky. If a bet was placed for the *next* round, we don't reset it here.
            // A better approach is to handle bet placement for the next round explicitly.
            // For now, let's reset on crash.
            
            setCountdown(WAITING_TIME / 1000);
            intervalId = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
            timerId = setTimeout(() => {
                if (isMounted.current) setPhase('running');
            }, WAITING_TIME);
        } else if (phase === 'running') {
            const crashPoint = Math.max(1.01, 1 + Math.pow(Math.random(), 3) * 100); // Higher potential crash point for longer games.
            startTimeRef.current = performance.now();

            const animate = (time: number) => {
                if (!isMounted.current) return;
                const elapsed = time - startTimeRef.current!;
                const currentMultiplier = 1.00 * Math.pow(1.00025, elapsed); // Slower growth

                if (currentMultiplier >= crashPoint) {
                    setMultiplier(crashPoint);
                    if (isMounted.current) setPhase('crashed');
                    return;
                }

                setMultiplier(currentMultiplier);
                setGraphPoints(points => [...points, [elapsed, currentMultiplier]]);

                setYAxisBounds(prevBounds => {
                    if (currentMultiplier > prevBounds.min + Y_AXIS_VISIBLE_RANGE * 0.7) {
                        const targetMax = currentMultiplier + Y_AXIS_VISIBLE_RANGE * 0.3;
                        const newMax = prevBounds.max + (targetMax - prevBounds.max) * 0.05;
                        return { max: newMax, min: newMax - Y_AXIS_VISIBLE_RANGE };
                    }
                    return prevBounds;
                });
                
                const currentBet1 = bet1Ref.current;
                const currentBet2 = bet2Ref.current;

                if (currentBet1.autoCollect && currentBet1.isPlaced && !currentBet1.hasCollected && currentMultiplier >= currentBet1.collectAt) {
                    handleCollect(1, currentBet1.collectAt);
                }
                if (currentBet2.autoCollect && currentBet2.isPlaced && !currentBet2.hasCollected && currentMultiplier >= currentBet2.collectAt) {
                    handleCollect(2, currentBet2.collectAt);
                }
                
                gameLoopRef.current = requestAnimationFrame(animate);
            };
            gameLoopRef.current = requestAnimationFrame(animate);
        } else if (phase === 'crashed') {
             setBet1(b => ({ ...b, isPlaced: false, hasCollected: false }));
             setBet2(b => ({ ...b, isPlaced: false, hasCollected: false }));
            timerId = setTimeout(() => {
                if (isMounted.current) setPhase('waiting');
            }, 3000);
        }

        return () => {
            if (timerId) clearTimeout(timerId);
            if (intervalId) clearInterval(intervalId);
            if (gameLoopRef.current) window.cancelAnimationFrame(gameLoopRef.current);
        };
    }, [phase, handleCollect]);


    const handlePlaceBet = async (panel: 1 | 2) => {
        const stateUpdater = panel === 1 ? setBet1 : setBet2;
        const betState = panel === 1 ? bet1 : bet2;

        if (betState.isPlaced) { // Cancel
            stateUpdater(s => ({...s, isPlaced: false}));
            await adjustBalance(betState.amount);
        } else { // Place
            if (profile && profile.balance >= betState.amount) {
                await adjustBalance(-betState.amount);
                stateUpdater(s => ({...s, isPlaced: true}));
            }
        }
    };
    
    const { pathData, lastPointPosition } = useMemo(() => {
        if (graphPoints.length < 2) return { pathData: `M 0,${VIEWBOX_HEIGHT}`, lastPointPosition: { x: 0, y: VIEWBOX_HEIGHT } };
    
        const lastTime = graphPoints[graphPoints.length - 1][0];
        const timeScale = VIEWBOX_WIDTH / Math.max(MAX_TIME_ON_GRAPH, lastTime);
        
        const multRange = yAxisBounds.max - yAxisBounds.min;
        if (multRange <= 0) return { pathData: `M 0,${VIEWBOX_HEIGHT}`, lastPointPosition: null };
        const multScale = VIEWBOX_HEIGHT / multRange;
    
        const mappedPath = "M " + graphPoints.map(([time, mult]) => 
            `${(time * timeScale).toFixed(2)} ${(VIEWBOX_HEIGHT - (mult - yAxisBounds.min) * multScale).toFixed(2)}`
        ).join(" L ");
    
        const lastPoint = graphPoints[graphPoints.length - 1];
        const lastPos = {
            x: (lastPoint[0] * timeScale),
            y: (VIEWBOX_HEIGHT - (lastPoint[1] - yAxisBounds.min) * multScale)
        };
    
        return { pathData: mappedPath, lastPointPosition: lastPos };
    }, [graphPoints, yAxisBounds]);
    
    const yAxisLabels = useMemo(() => {
        const labels = [];
        const { min, max } = yAxisBounds;
        const range = max - min;
        if (range <= 0) return [];
        
        let step = 0.2;
        if (range > 2) step = 0.5;
        if (range > 5) step = 1;
        if (range > 10) step = 2;
        if (range > 20) step = 5;
        if (range > 50) step = 10;

        const startValue = Math.ceil(min / step) * step;

        for (let i = startValue; i < max * 1.1; i += step) {
            labels.push(i);
        }
        return labels;
    }, [yAxisBounds]);
    const xAxisLabels = [0, 2, 4, 6, 8, 10, 12];

    const getMultiplierColor = () => {
        if (phase === 'crashed') return 'text-red-500';
        if (phase === 'running') return 'text-white';
        return 'text-gray-500';
    };

    return (
    <div className="bg-slate-900 h-screen flex flex-col font-poppins text-white select-none">
      <header className="flex items-center justify-between p-3 bg-slate-800/50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold uppercase text-green-400">Crash</h1>
        </div>
        <div className="flex items-center bg-black/30 rounded-md px-4 py-1.5">
          <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
          <span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button>
          <button className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
        </div>
      </header>
      
      <main className="flex-grow p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl aspect-[2/1] relative crash-graph-container rounded-lg p-4">
           {/* Multiplier Display */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              {phase === 'waiting' && <p className="text-2xl font-bold text-gray-400">Next round in {countdown.toFixed(0)}s</p>}
              <p className={`font-bebas text-8xl font-bold drop-shadow-2xl transition-colors duration-300 ${getMultiplierColor()}`}>{multiplier.toFixed(2)}x</p>
              {phase === 'crashed' && <p className="text-2xl font-bold text-red-500">Crashed!</p>}
           </div>

           {/* Graph SVG */}
            <svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0.5" x2="1" y2="0.5">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="25%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="75%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Grid and Labels */}
                {yAxisLabels.map(label => {
                    const y = VIEWBOX_HEIGHT - (label - yAxisBounds.min) * (VIEWBOX_HEIGHT / (yAxisBounds.max - yAxisBounds.min));
                    if (y < -10 || y > VIEWBOX_HEIGHT + 10) return null;
                    return <g key={`y-${label}`}>
                        <line x1="0" y1={y} x2={VIEWBOX_WIDTH} y2={y} stroke="rgba(255,255,255,0.05)" />
                        <text x={VIEWBOX_WIDTH - 10} y={y - 5} fill="rgba(255,255,255,0.3)" textAnchor="end" fontSize="14">{label.toFixed(2)}x</text>
                    </g>
                })}
                {xAxisLabels.map(label => {
                    const x = (label * 1000) * (VIEWBOX_WIDTH / MAX_TIME_ON_GRAPH);
                    return <g key={`x-${label}`}>
                        <line x1={x} y1="0" x2={x} y2={VIEWBOX_HEIGHT} stroke="rgba(255,255,255,0.05)" />
                         <text x={x + 5} y={VIEWBOX_HEIGHT - 5} fill="rgba(255,255,255,0.3)" fontSize="14">{label}s</text>
                    </g>
                })}

                {/* Graph Line */}
                <path d={pathData} fill="none" stroke={phase === 'running' ? "url(#lineGradient)" : (phase === 'crashed' ? "#ef4444" : "#4b5563")} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

                {/* Glowing Ball */}
                {phase === 'running' && lastPointPosition && (
                     <circle cx={lastPointPosition.x} cy={lastPointPosition.y} r="8" fill="white" filter="url(#glow)" />
                )}
            </svg>
        </div>
      </main>

      <footer className="shrink-0 bg-slate-800/30 p-4">
        <div className="w-full max-w-4xl mx-auto flex gap-4">
            <BetPanel betState={bet1} onBetStateChange={(s) => setBet1(b => ({ ...b, ...s }))} onPlaceBet={() => handlePlaceBet(1)} onCollect={() => handleCollect(1, multiplier)} gamePhase={phase} canBet={!!profile && profile.balance >= bet1.amount} />
            <BetPanel betState={bet2} onBetStateChange={(s) => setBet2(b => ({ ...b, ...s }))} onPlaceBet={() => handlePlaceBet(2)} onCollect={() => handleCollect(2, multiplier)} gamePhase={phase} canBet={!!profile && profile.balance >= bet2.amount} />
        </div>
      </footer>
    </div>
  );
};

export default CrashGame;