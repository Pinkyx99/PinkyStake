import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const WAITING_TIME = 7000;

type GamePhase = 'waiting' | 'running' | 'crashed';
type Point = { t: number; m: number }; // time, multiplier

type OtherPlayer = {
  id: number;
  name: string;
  bet: number;
  cashoutAt: number | null;
  status: 'waiting' | 'playing' | 'cashed_out' | 'lost';
};

const FAKE_USERNAMES = ['RocketMan', 'ToTheMoon', 'DiamondHand', 'CrashKing', 'GambleGod', 'HighRoller', 'LuckyDuck', 'Winner22', 'Player1337', 'Stonks'];

const PlayerBetsList: React.FC<{ players: OtherPlayer[] }> = ({ players }) => {
    return (
        <div className="flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b-2 border-slate-700/50 mb-2">Current Round</h3>
            <div className="flex-grow overflow-y-auto player-bets-list">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center text-xs">
                    {players.map(p => (
                        <React.Fragment key={p.id}>
                            <div className="truncate font-semibold text-slate-300">{p.name}</div>
                            <div className="font-mono text-slate-400">{p.bet.toFixed(2)}</div>
                            <div className={`font-bold font-mono text-right ${
                                p.status === 'cashed_out' ? 'text-green-400' :
                                p.status === 'lost' ? 'text-red-500' : 'text-slate-500'
                            }`}>
                                {p.status === 'cashed_out' && p.cashoutAt ? `${p.cashoutAt.toFixed(2)}x` : p.status === 'lost' ? 'Lost' : '-'}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};


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
        if (Math.random() < 0.01) return 1.00;
        const r = Math.random() * 100;
        let crashPoint: number;
        if (r < 0.10) { crashPoint = 1000 + Math.random() * 9000; }
        else if (r < 0.10 + 1.98) { crashPoint = 50 + Math.random() * 950; }
        else if (r < 0.10 + 1.98 + 4.95) { crashPoint = 20 + Math.random() * 30; }
        else if (r < 0.10 + 1.98 + 4.95 + 9.90) { crashPoint = 10 + Math.random() * 10; }
        else if (r < 0.10 + 1.98 + 4.95 + 9.90 + 14.0) { crashPoint = 7 + Math.random() * 3; }
        else if (r < 0.10 + 1.98 + 4.95 + 9.90 + 14.0 + 19.80) { crashPoint = 5 + Math.random() * 2; }
        else { const lowR = Math.random(); crashPoint = 1.01 + Math.pow(lowR, 3) * 3.99; }
        return Math.floor(crashPoint * 100) / 100;
    };


    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout> | undefined;
        let intervalId: ReturnType<typeof setInterval> | undefined;

        if (phase === 'waiting') {
            setMultiplier(1.00);
            setCashedOutMultiplier(null);
            setActiveBet(null);
            setCountdown(WAITING_TIME / 1000);
            
            const numPlayers = Math.floor(Math.random() * 8) + 5;
            const newPlayers: OtherPlayer[] = Array.from({ length: numPlayers }).map((_, i) => ({
                id: i,
                name: FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)] + (Math.floor(Math.random() * 900) + 100),
                bet: parseFloat((Math.random() * 50 + 1).toFixed(2)),
                cashoutAt: null,
                status: 'waiting',
            }));
            setOtherPlayers(newPlayers);

            intervalId = setInterval(() => setCountdown(c => Math.max(0, c - 0.1)), 100);
            timerId = setTimeout(() => { if (isMounted.current) setPhase('running'); }, WAITING_TIME);
        } else if (phase === 'running') {
            crashPointRef.current = generateCrashPoint();
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
                    const cashoutTimeMs = 5000 * Math.log(player.cashoutAt);
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
        let path: Point[] = [];
        
        const draw = (time: number) => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            const { width, height } = rect;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);

            if (phase === 'running') {
                const elapsedSinceStart = time - startTimeRef.current!;
                const currentMultiplier = Math.exp(elapsedSinceStart / 5000);
                if (currentMultiplier >= crashPointRef.current) {
                    playSound('lose');
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

            const elapsed = phase === 'waiting' ? 0 : (performance.now() - (startTimeRef.current ?? performance.now()));
            const currentTime = Math.max(0, elapsed / 1000);
            path.push({ t: currentTime, m: multiplier });
            if (path.length > 200) path.shift();
            
            // Camera/View logic
            const padding = { top: 20, right: 20, bottom: 40, left: 50 };
            const viewWidth = width - padding.left - padding.right;
            const viewHeight = height - padding.top - padding.bottom;
            const maxTime = Math.max(5, path[path.length - 1]?.t * 1.2 || 5);
            const maxMult = Math.max(2, path[path.length - 1]?.m * 1.2 || 2);
            
            const worldToScreen = (t: number, m: number) => ({
                x: padding.left + (t / maxTime) * viewWidth,
                y: height - padding.bottom - ((m - 1) / (maxMult - 1)) * viewHeight
            });

            const drawAxes = () => {
                ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
                ctx.fillStyle = "#64748b";
                ctx.font = "10px Poppins";
                ctx.lineWidth = 1;

                // Y-Axis (Multiplier)
                const yStep = maxMult < 10 ? 1 : maxMult < 50 ? 5 : maxMult < 200 ? 20 : 100;
                for (let i = 1; i < maxMult; i += yStep) {
                    if (i < 1) continue;
                    const yPos = height - padding.bottom - ((i) / (maxMult - 1)) * (height - padding.top - padding.bottom);
                    ctx.beginPath(); ctx.moveTo(padding.left - 5, yPos); ctx.lineTo(width - padding.right, yPos); ctx.stroke();
                    ctx.fillText(`${(i + 1).toFixed(0)}x`, padding.left - 30, yPos + 3);
                }
                
                // X-Axis (Time)
                const xStep = maxTime < 10 ? 1 : 2;
                for (let i = 0; i < maxTime; i += xStep) {
                    if(i === 0) continue;
                    const xPos = padding.left + (i / maxTime) * (width - padding.left - padding.right);
                    ctx.beginPath(); ctx.moveTo(xPos, padding.top); ctx.lineTo(xPos, height - padding.bottom + 5); ctx.stroke();
                    ctx.fillText(`${i}s`, xPos - 5, height - padding.bottom + 15);
                }
            };

            const drawGraph = (points: {x: number, y: number}[]) => {
                if (points.length < 2) return;
                const path2d = new Path2D();
                path2d.moveTo(points[0].x, points[0].y);
                points.forEach(p => path2d.lineTo(p.x, p.y));

                const fillPath = new Path2D(path2d);
                fillPath.lineTo(points[points.length-1].x, height - padding.bottom);
                fillPath.lineTo(points[0].x, height - padding.bottom);
                fillPath.closePath();
                
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, 'rgba(251, 146, 60, 0)');
                gradient.addColorStop(0.8, 'rgba(251, 146, 60, 0.4)');
                ctx.fillStyle = gradient;
                ctx.fill(fillPath);
                
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
                ctx.shadowColor = 'rgba(255,255,255,0.5)'; ctx.shadowBlur = 10;
                ctx.stroke(path2d);
                ctx.shadowBlur = 0;
            };

            const drawRocket = (pos: {x:number, y:number}, angle: number, isCrashed: boolean) => {
                if (isCrashed) {
                    ctx.fillStyle = `rgba(248, 113, 113, ${Math.random() * 0.5 + 0.5})`;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 15 + Math.random() * 10, 0, Math.PI * 2);
                    ctx.fill();
                    return;
                }
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(angle);
                ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 20;
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.moveTo(10, 0); ctx.lineTo(-7, 5); ctx.lineTo(-7, -5); ctx.closePath();
                ctx.fill();
                ctx.restore();
            };

            drawAxes();
            
            const screenPoints = path.map(p => worldToScreen(p.t, p.m));
            drawGraph(screenPoints);

            const lastPoint = screenPoints[screenPoints.length - 1];
            if (lastPoint) {
                const prevPoint = screenPoints[screenPoints.length - 2] || {x: padding.left, y: height-padding.bottom};
                const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
                drawRocket(lastPoint, angle, phase === 'crashed');
            }
            
            animationFrameId = requestAnimationFrame(draw);
        }
        
        animationFrameId = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(animationFrameId); }
    }, [phase, multiplier, playSound]);
    
    const getMultiplierClass = () => {
        if (cashedOutMultiplier) return 'crash-multiplier-text-cashed';
        if (phase === 'crashed') return 'crash-multiplier-text-crashed';
        if (phase === 'running') return 'crash-multiplier-text-running';
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

    return (
    <div className="bg-[#1a1d3a] h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
      {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
      <header className="flex items-center justify-between p-3 shrink-0 z-20 bg-[#1a1d3a]/80 backdrop-blur-sm">
        <div className="flex-1"><button onClick={onBack}><ArrowLeftIcon className="w-6 h-6" /></button></div>
        <div className="flex-1 flex justify-center"><div className="bg-black/30 rounded-md px-3 py-1.5"><span className="font-bold">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span></div></div>
        <div className="flex-1 flex justify-end items-center gap-3"><button><SoundOnIcon className="w-5 h-5"/></button><button><GameRulesIcon className="w-5 h-5"/></button></div>
      </header>
      
      <main className="flex-grow w-full flex overflow-hidden">
        <div className="flex-grow flex flex-col">
            <div className="flex-grow relative crash-graph-container">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-center">
                        {phase === 'waiting' && (
                            <div className="flex flex-col items-center"><p className="text-4xl text-slate-400">Next round in</p><p className="text-7xl text-slate-200 font-bold">{countdown.toFixed(1)}s</p></div>
                        )}
                        {(phase === 'running' || phase === 'crashed') && (
                            <div className="flex flex-col items-center">
                                {phase === 'crashed' && <p className="text-4xl font-semibold text-red-500">Crashed at</p>}
                                <h2 className={`font-bebas text-8xl transition-colors duration-300 ${getMultiplierClass()}`}>{multiplier.toFixed(2)}x</h2>
                                <p className="text-sm text-slate-300/80 tracking-widest font-semibold">BETS {otherPlayers.length + (activeBet ? 1 : 0)}</p>
                                {cashedOutMultiplier && (<p className="text-2xl font-bold mt-2 crash-multiplier-text-cashed">CASHED OUT {cashedOutMultiplier.toFixed(2)}X</p>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <footer className="shrink-0 bg-[#0f172a] p-3 border-t-2 border-slate-800 z-20">
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
        </div>
        <div className="w-64 lg:w-72 shrink-0 bg-slate-900/50 p-3 flex flex-col border-l-2 border-slate-800">
           <PlayerBetsList players={otherPlayers} />
        </div>
      </main>
    </div>
  );
};

export default CrashGame;
