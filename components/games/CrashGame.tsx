import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '../../contexts/UserContext.tsx';
import useAnimatedBalance from '../../hooks/useAnimatedBalance.tsx';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import { useSound } from '../../hooks/useSound.ts';
import WinAnimation from '../WinAnimation.tsx';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const WAITING_TIME = 7000;
const MULTIPLIER_SPEED = 10000; // Increased to slow down the curve for a smoother feel

type GamePhase = 'waiting' | 'running' | 'crashed';
type Point = { t: number; m: number }; // time, multiplier

type OtherPlayer = {
  id: number;
  name: string;
  avatarUrl: string;
  bet: number;
  cashoutAt: number | null;
  status: 'waiting' | 'playing' | 'cashed_out' | 'lost';
};

const FAKE_USERNAMES = ['RocketMan', 'ToTheMoon', 'DiamondHand', 'CrashKing', 'GambleGod', 'HighRoller', 'LuckyDuck', 'Winner22', 'Player1337', 'Stonks'];
const FAKE_AVATARS = [
    'https://i.imgur.com/s6p4eF8.png',
    'https://i.imgur.com/5J7m1jR.png',
    'https://i.imgur.com/9n9s8Z2.png',
    'https://i.imgur.com/cO1k2L4.png',
    'https://i.imgur.com/z1kH0B5.png',
];

const CrashGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [phase, setPhase] = useState<GamePhase>('waiting');
    const [countdown, setCountdown] = useState(WAITING_TIME / 1000);
    const [multiplier, setMultiplier] = useState(1.00);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState('5.00');
    
    const [queuedBet, setQueuedBet] = useState<number | null>(null);
    const [activeBet, setActiveBet] = useState<number | null>(null);
    const [cashedOutMultiplier, setCashedOutMultiplier] = useState<number | null>(null);
    
    const [history, setHistory] = useState([2.70, 6.01, 1.34, 11.92, 1.01, 3.08, 2.48, 1.36, 4.56, 1.98, 1.55, 1.23]);
    const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
    
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const crashPointRef = useRef(1.0);
    const pathRef = useRef<Point[]>([{t: 0, m: 1.0}]);
    
    const isMounted = useRef(true);
    const phaseRef = useRef(phase);
    const { playSound } = useSound();

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);
    useEffect(() => { setBetInput(betAmount.toFixed(2)); }, [betAmount]);
    useEffect(() => { phaseRef.current = phase }, [phase]);
    
    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        else if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const handleCashout = useCallback(() => {
        if (phase !== 'running' || !activeBet || cashedOutMultiplier) return;
        
        const winnings = activeBet * multiplier;
        const netWinnings = winnings - activeBet;
        if (netWinnings > 0) {
            setWinData({ amount: netWinnings, key: Date.now() });
        }
        adjustBalance(winnings);
        playSound('cashout');

        if (isMounted.current) {
            setCashedOutMultiplier(multiplier);
        }
    }, [phase, activeBet, cashedOutMultiplier, multiplier, adjustBalance, playSound]);
    
    const handleBetButton = async () => {
        if (phase !== 'waiting') return;
        
        if (queuedBet) { // Cancel bet
            playSound('click');
            await adjustBalance(queuedBet);
            if (isMounted.current) setQueuedBet(null);
        } else { // Place bet
            if (profile && profile.balance >= betAmount) {
                playSound('bet');
                await adjustBalance(-betAmount);
                if (isMounted.current) setQueuedBet(betAmount);
            }
        }
    };
    
    const generateCrashPoint = () => {
        // This function implements the odds provided: P(crash >= x) = 99 / x
        // We use inverse transform sampling.
        const r = Math.random();
        // The formula for the crash point `c` is derived from `u = 1 - (99/c)`, where u is a uniform random number.
        // This simplifies to c = 99 / (1-u). Since (1-u) is also uniform, we can just use `r`.
        const crashPoint = 0.99 / r;
        
        // Clamp the minimum crash point to 1.00 and cap at a high value for stability.
        const result = Math.min(1_000_000, Math.max(1.00, crashPoint));
    
        return Math.floor(result * 100) / 100; // Return with 2 decimal places
    };


    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout> | undefined;
        let intervalId: ReturnType<typeof setInterval> | undefined;

        if (phase === 'waiting') {
            pathRef.current = [{t: 0, m: 1.0}];
            setMultiplier(1.00);
            setCashedOutMultiplier(null);
            setActiveBet(null);
            setCountdown(WAITING_TIME / 1000);
            
            const numPlayers = Math.floor(Math.random() * 8) + 5;
            const newPlayers: OtherPlayer[] = Array.from({ length: numPlayers }).map((_, i) => ({
                id: i,
                name: FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)] + (Math.floor(Math.random() * 900) + 100),
                avatarUrl: FAKE_AVATARS[Math.floor(Math.random() * FAKE_AVATARS.length)],
                bet: parseFloat((Math.random() * 50 + 1).toFixed(2)),
                cashoutAt: null,
                status: 'waiting',
            }));
            setOtherPlayers(newPlayers);

            intervalId = setInterval(() => setCountdown(c => Math.max(0, c - 0.1)), 100);
            timerId = setTimeout(() => { if (isMounted.current) setPhase('running'); }, WAITING_TIME);
        } else if (phase === 'running') {
            crashPointRef.current = generateCrashPoint();
            pathRef.current = [];
            startTimeRef.current = performance.now();
            if (queuedBet) { setActiveBet(queuedBet); setQueuedBet(null); }

            const playersWithCashouts = otherPlayers.map(p => {
                if (Math.random() < 0.25) return { ...p, status: 'playing' as const };
                const r = Math.random();
                const cashoutPoint = 1.01 + Math.pow(r, 2.5) * (crashPointRef.current * 0.95 - 1.01);
                return { ...p, cashoutAt: Math.max(1.01, cashoutPoint), status: 'playing' as const };
            });
            setOtherPlayers(playersWithCashouts);

            playersWithCashouts.forEach(player => {
                if (player.cashoutAt) {
                    const cashoutTimeMs = MULTIPLIER_SPEED * Math.log(player.cashoutAt);
                    setTimeout(() => {
                        if (isMounted.current && phaseRef.current === 'running') {
                            setOtherPlayers(prev => prev.map(p => p.id === player.id ? { ...p, status: 'cashed_out' } : p));
                        }
                    }, cashoutTimeMs);
                }
            });

        } else if (phase === 'crashed') {
            setOtherPlayers(prev => prev.map(p => p.status === 'playing' ? { ...p, status: 'lost' } : p));
            timerId = setTimeout(() => { if (isMounted.current) setPhase('waiting'); }, 3000);
        }

        return () => { clearTimeout(timerId); clearInterval(intervalId); };
    }, [phase]);

    // Canvas drawing loop
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        
        let animationFrameId: number;
        
        const draw = (time: number) => {
            if (!isMounted.current) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            const { width, height } = rect;

            ctx.clearRect(0, 0, width, height);
            
            // Background Gradient
            const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
            bgGradient.addColorStop(0, '#1e293b');
            bgGradient.addColorStop(1, '#0f172a');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            if (phase === 'running' && startTimeRef.current) {
                const elapsedSinceStart = time - startTimeRef.current;
                const currentMultiplier = Math.exp(elapsedSinceStart / MULTIPLIER_SPEED);
                
                if (Math.floor(multiplier * 10) !== Math.floor(currentMultiplier * 10)) {
                    playSound('crash_tick', { pitch: currentMultiplier });
                }

                if (currentMultiplier >= crashPointRef.current) {
                    playSound('crash_explode');
                    if (isMounted.current) {
                        setMultiplier(crashPointRef.current);
                        setHistory(h => [crashPointRef.current, ...h].slice(0, 20));
                        setActiveBet(null);
                        setPhase('crashed');
                    }
                } else {
                    if(isMounted.current) setMultiplier(currentMultiplier);
                }
            }

            const elapsed = phase === 'running' && startTimeRef.current ? (performance.now() - startTimeRef.current) : 0;
            const currentTime = Math.max(0, elapsed / 1000);
            
            if (phase === 'running') {
                pathRef.current.push({ t: currentTime, m: multiplier });
            }
            if (pathRef.current.length > 500) pathRef.current.shift();
            
            const path = pathRef.current;
            const padding = { top: 20, right: 20, bottom: 40, left: 60 };
            const viewWidth = width - padding.left - padding.right;
            const viewHeight = height - padding.top - padding.bottom;
            
            const latestPoint = path[path.length - 1];
            const maxTime = Math.max(5, (latestPoint?.t || 0) * 1.25);
            const maxMult = Math.max(2.4, (latestPoint?.m || 1) * 1.25);
            
            const worldToScreen = (t: number, m: number) => ({
                x: padding.left + (t / maxTime) * viewWidth,
                y: height - padding.bottom - ((m - 1) / (maxMult - 1)) * viewHeight
            });

            // Draw Axes
            ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px Poppins";
            ctx.lineWidth = 1;

            const yAxisTicks = 5;
            for (let i = 1; i <= yAxisTicks; i++) {
                const m = 1 + (i / yAxisTicks) * (maxMult - 1);
                const yPos = worldToScreen(0, m).y;
                ctx.beginPath(); ctx.moveTo(padding.left - 5, yPos); ctx.lineTo(width - padding.right, yPos); ctx.stroke();
                ctx.fillText(`${m.toFixed(2)}x`, padding.left - 50, yPos + 4);
            }
            
            const xAxisTicks = 5;
            for (let i = 1; i <= xAxisTicks; i++) {
                const t = (i / xAxisTicks) * maxTime;
                const xPos = worldToScreen(t, 1).x;
                ctx.beginPath(); ctx.moveTo(xPos, padding.top); ctx.lineTo(xPos, height - padding.bottom + 5); ctx.stroke();
                ctx.fillText(`${t.toFixed(0)}s`, xPos - 5, height - padding.bottom + 20);
            }

            // Draw Graph
            const screenPoints = path.map(p => worldToScreen(p.t, p.m));
            if (screenPoints.length > 1) {
                const path2d = new Path2D();
                path2d.moveTo(screenPoints[0].x, screenPoints[0].y);
                screenPoints.slice(1).forEach(p => path2d.lineTo(p.x, p.y));

                const fillPath = new Path2D(path2d);
                fillPath.lineTo(screenPoints[screenPoints.length-1].x, height - padding.bottom);
                fillPath.lineTo(screenPoints[0].x, height - padding.bottom);
                fillPath.closePath();
                
                const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
                fillGradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
                fillGradient.addColorStop(1, 'rgba(17, 24, 39, 0)');
                ctx.fillStyle = fillGradient;
                ctx.fill(fillPath);
                
                const lineGradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0);
                lineGradient.addColorStop(0, '#60a5fa');
                lineGradient.addColorStop(0.5, '#facc15');
                lineGradient.addColorStop(1, '#f97316');
                ctx.strokeStyle = lineGradient;
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.shadowColor = 'rgba(253, 186, 116, 0.5)';
                ctx.shadowBlur = 25;
                ctx.stroke(path2d);
                ctx.shadowBlur = 0;

                const lastPoint = screenPoints[screenPoints.length - 1];
                if (lastPoint && phase === 'running') {
                    const glow = ctx.createRadialGradient(lastPoint.x, lastPoint.y, 0, lastPoint.x, lastPoint.y, 20);
                    glow.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
                    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                    ctx.fillStyle = glow;
                    ctx.fillRect(lastPoint.x - 20, lastPoint.y - 20, 40, 40);

                    ctx.beginPath();
                    ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#fde047';
                    ctx.fill();
                }
            }
            
            animationFrameId = requestAnimationFrame(draw);
        }
        
        animationFrameId = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(animationFrameId); }
    }, [phase, multiplier, playSound]);
    
    const getMultiplierClass = () => {
        if (cashedOutMultiplier) return 'text-green-400';
        if (phase === 'crashed') return 'text-red-500 animate-crash-text-shake';
        if (phase === 'running') return 'text-white';
        return 'text-slate-500';
    };

    const isBettingPhase = phase === 'waiting';

    const actionButton = useMemo(() => {
        if (phase === 'running') {
            const cashoutAmount = (activeBet || 0) * multiplier;
            return (
                <button
                    onClick={handleCashout}
                    disabled={!activeBet || !!cashedOutMultiplier}
                    className="w-full h-full text-lg font-bold rounded-md bg-green-500 hover:bg-green-600 text-black transition-colors disabled:bg-green-500/30 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight"
                >
                    Cashout
                    <span className="text-sm">{cashoutAmount.toFixed(2)} EUR</span>
                </button>
            )
        }
        const text = queuedBet ? 'Cancel Bet' : 'Place Bet';
        const colorClass = queuedBet ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-500 hover:bg-green-600 text-black';
        return (
             <button
                onClick={handleBetButton}
                disabled={!isBettingPhase || (!queuedBet && (!profile || betAmount > profile.balance))}
                className={`w-full h-full text-lg font-bold rounded-md transition-colors disabled:bg-slate-600/50 disabled:cursor-not-allowed ${colorClass}`}
            >
               {text}
            </button>
        )
    }, [phase, activeBet, multiplier, cashedOutMultiplier, queuedBet, betAmount, profile, handleCashout, handleBetButton, isBettingPhase]);
    
    const sortedPlayers = useMemo(() => {
        return [...otherPlayers].sort((a, b) => {
            const aCashed = a.status === 'cashed_out';
            const bCashed = b.status === 'cashed_out';
            if (aCashed && !bCashed) return -1;
            if (!aCashed && bCashed) return 1;
            if (aCashed && bCashed) return (b.cashoutAt || 0) - (a.cashoutAt || 0);
            return b.bet - a.bet;
        });
    }, [otherPlayers]);

    return (
    <div className="bg-[#0f172a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
      {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
      <header className="flex items-center justify-between p-3 shrink-0 z-20 bg-[#1a1d3a]/80 backdrop-blur-sm">
        <div className="flex-1"><button onClick={onBack}><ArrowLeftIcon className="w-6 h-6" /></button></div>
        <div className="flex-1 flex justify-center"><div className="bg-black/30 rounded-md px-3 py-1.5"><span className="font-bold">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span></div></div>
        <div className="flex-1 flex justify-end items-center gap-3"><button><SoundOnIcon className="w-5 h-5"/></button><button><GameRulesIcon className="w-5 h-5"/></button></div>
      </header>
      
      <main className="flex-grow w-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 p-2 z-10">
            <div className="flex items-center gap-2 overflow-x-auto" style={{'scrollbarWidth': 'none'}}>
                {history.map((h, i) => (
                    <div key={i} className={`px-3 py-1 text-xs font-bold rounded-full shrink-0 ${h >= 1.95 ? 'bg-green-500/30 text-green-300' : 'bg-slate-700/50 text-slate-300'}`}>
                        {h.toFixed(2)}x
                    </div>
                ))}
            </div>
        </div>
            
        <div className="flex-grow relative">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            
            {phase === 'crashed' && <div className="absolute inset-0 bg-red-600/20 animate-crash-flash pointer-events-none z-20"></div>}
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center">
                    {phase === 'waiting' && (
                        <div className="flex flex-col items-center">
                            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Next Round In</p>
                            <p className="text-7xl text-slate-200 font-bold">{countdown.toFixed(1)}s</p>
                        </div>
                    )}
                    {(phase === 'running' || phase === 'crashed') && (
                        <div className="flex flex-col items-center">
                            {phase === 'crashed' && <p className="text-2xl font-semibold text-red-500 animate-crash-text-shake">Crashed at</p>}
                            {phase === 'running' && <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Current Round</p>}
                            <h2 className={`font-extrabold text-9xl transition-colors duration-300 ${getMultiplierClass()}`}>{multiplier.toFixed(2)}x</h2>
                        </div>
                    )}
                    {cashedOutMultiplier && (
                        <div className="mt-4 bg-slate-900/80 px-4 py-2 rounded-lg">
                            <p className="text-lg font-bold text-green-400">Cashed Out @ {cashedOutMultiplier.toFixed(2)}x</p>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="absolute top-16 bottom-4 right-4 w-60 space-y-1.5 z-10">
                <div className="h-full overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                    {activeBet && (
                        <div className={`sticky top-0 z-10 transition-all duration-300 rounded-full px-3 py-2 text-sm flex items-center justify-between gap-2 backdrop-blur-sm mb-2 border ${
                            cashedOutMultiplier ? 'bg-green-500/20 border-green-500/30' : 'bg-blue-500/20 border-blue-500/30'
                        }`}>
                            <div className="flex items-center gap-2 truncate">
                                <img src={'https://i.imgur.com/sIqj4t2.png'} alt="user avatar" className="w-6 h-6 rounded-full"/>
                                <span className="truncate font-bold text-white">{profile?.username}</span>
                            </div>
                            {cashedOutMultiplier ? (
                                <div className="text-right">
                                    <span className="font-bold text-green-300 shrink-0">{cashedOutMultiplier.toFixed(2)}x</span>
                                    <p className="text-xs text-green-400">+{(activeBet * cashedOutMultiplier - activeBet).toFixed(2)}</p>
                                </div>
                            ) : (
                                <span className="font-semibold text-yellow-300 shrink-0">${activeBet.toFixed(2)}</span>
                            )}
                        </div>
                    )}
                    {sortedPlayers.map(p => (
                        <div key={p.id} className={`transition-all duration-300 rounded-full pl-2 pr-3 py-1.5 text-xs flex items-center justify-between gap-2 backdrop-blur-sm ${
                            p.status === 'cashed_out' ? 'bg-slate-800/60' : p.status === 'lost' ? 'bg-red-900/40 opacity-60' : 'bg-slate-900/60'
                        }`}>
                            <div className="flex items-center gap-1.5 truncate">
                                <img src={p.avatarUrl} alt={p.name} className="w-5 h-5 rounded-full"/>
                                <span className="truncate text-slate-300">{p.name}</span>
                            </div>
                            {p.status === 'cashed_out' && <span className="font-bold text-green-400 shrink-0">{p.cashoutAt?.toFixed(2)}x</span>}
                            {(p.status === 'playing' || p.status === 'waiting') && <span className="font-semibold text-yellow-400 shrink-0">${p.bet.toFixed(2)}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <footer className="shrink-0 bg-[#1e293b] p-3 border-t-2 border-slate-800 z-20">
            <div className="w-full max-w-lg mx-auto flex items-stretch justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-md">
                    <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isBettingPhase || !!queuedBet} className="w-24 bg-transparent border-0 text-center font-bold text-lg focus-visible:ring-0 disabled:text-gray-400"/>
                    <span className="text-gray-400 font-semibold pr-2">EUR</span>
                    <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isBettingPhase || !!queuedBet} className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-sm disabled:opacity-50 h-full">2x</button>
                    <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isBettingPhase || !!queuedBet} className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-sm disabled:opacity-50 h-full">1/2</button>
                </div>
                <div className="w-64 h-14">{actionButton}</div>
            </div>
        </footer>
      </main>
    </div>
  );
};

export default CrashGame;