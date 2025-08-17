


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import UndoIcon from '../icons/UndoIcon';
import RebetIcon from '../icons/RebetIcon';
import ClearIcon from '../icons/ClearIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useUser } from '../../contexts/UserContext';
import RouletteRulesModal from './roulette/RouletteRulesModal';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;

const CHIP_DATA = [
  { value: 1, imageUrl: 'https://i.imgur.com/MBcZKEV.png' },
  { value: 5, imageUrl: 'https://i.imgur.com/gLiu4Mt.png' },
  { value: 10, imageUrl: 'https://i.imgur.com/LgRh7aq.png' },
  { value: 25, imageUrl: 'https://i.imgur.com/WvXW3ur.png' },
  { value: 50, imageUrl: 'https://i.imgur.com/5xzCWcm.png' },
  { value: 100, imageUrl: 'https://i.imgur.com/Gvd4wzs.png' },
];
const CHIP_VALUES = CHIP_DATA.map(c => c.value);

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
};

type GamePhase = 'betting' | 'spinning' | 'result';
type BetSpot = number | string;
type Bets = Record<BetSpot, number>;

const PAYOUTS: Record<string, number> = {
    'straight': 35, 'red': 1, 'black': 1, 'even': 1, 'odd': 1, 'low': 1, 'high': 1,
    'dozen1': 2, 'dozen2': 2, 'dozen3': 2, 'col1': 2, 'col2': 2, 'col3': 2,
};

const numberToBetSpots = (num: number): string[] => {
    if (num === 0) return ['0'];
    const spots: string[] = [num.toString()];
    if (RED_NUMBERS.has(num)) spots.push('red'); else spots.push('black');
    if (num % 2 === 0) spots.push('even'); else spots.push('odd');
    if (num >= 1 && num <= 18) spots.push('low'); else spots.push('high');
    if (num >= 1 && num <= 12) spots.push('dozen1');
    else if (num >= 13 && num <= 24) spots.push('dozen2');
    else spots.push('dozen3');
    if (num % 3 === 1) spots.push('col1');
    else if (num % 3 === 2) spots.push('col2');
    else spots.push('col3');
    return spots;
};

const BetNumber: React.FC<{ num: number, onBet: (spot: BetSpot) => void, betAmount?: number, className?: string }> = ({ num, onBet, betAmount, className = '' }) => {
    const color = getNumberColor(num);
    const bgColor = color === 'red' ? 'bg-red-600' : color === 'black' ? 'bg-gray-800' : 'bg-green-600';
    return (
        <button onClick={() => onBet(num)} className={`relative aspect-square flex items-center justify-center text-lg font-bold ${bgColor} hover:bg-opacity-80 transition-colors rounded-sm ${className}`}>
            {num}
            {betAmount && betAmount > 0 && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-yellow-400/80 flex items-center justify-center text-xs text-black font-bold shadow-lg">{betAmount}</div></div>}
        </button>
    );
};

const BetArea: React.FC<{ label: string, onBet: () => void, betAmount?: number, className?: string }> = ({ label, onBet, betAmount, className }) => (
    <button onClick={onBet} className={`relative flex items-center justify-center p-2 text-sm font-semibold bg-green-700/50 hover:bg-green-600/50 transition-colors rounded-sm ${className}`}>
        {label}
        {betAmount && betAmount > 0 && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-yellow-400/80 flex items-center justify-center text-xs text-black font-bold shadow-lg">{betAmount}</div></div>}
    </button>
);

const RouletteGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [selectedChip, setSelectedChip] = useState(CHIP_VALUES[0]);
    const [bets, setBets] = useState<Bets>({});
    const [lastBets, setLastBets] = useState<Bets>({});
    const [betHistory, setBetHistory] = useState<{ spot: BetSpot, amount: number }[]>([]);
    const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
    const [winningNumber, setWinningNumber] = useState<number | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
    
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballOrbitRotation, setBallOrbitRotation] = useState(0);
    const [wheelAnimation, setWheelAnimation] = useState<React.CSSProperties>({});
    const [ballAnimation, setBallAnimation] = useState<{orbiting: React.CSSProperties, settling: React.CSSProperties}>({orbiting: {}, settling: {}});

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

    const totalBet = useMemo(() => Object.values(bets).reduce((sum, amount) => sum + amount, 0), [bets]);

    const handlePlaceBet = useCallback((spot: BetSpot) => {
        if (gamePhase !== 'betting' || !profile || profile.balance < totalBet + selectedChip) return;
        playSound('bet');
        setBets(prev => ({ ...prev, [spot]: (prev[spot] || 0) + selectedChip }));
        setBetHistory(prev => [...prev, { spot, amount: selectedChip }]);
    }, [gamePhase, selectedChip, profile, totalBet, playSound]);

    const handleSpin = async () => {
        if (totalBet === 0 || gamePhase !== 'betting') return;
        
        await adjustBalance(-totalBet);
        if(!isMounted.current) return;

        setLastBets(bets);
        setGamePhase('spinning');
        
        const winningIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
        const winner = WHEEL_NUMBERS[winningIndex];
        setWinningNumber(winner);

        const anglePerSegment = 360 / WHEEL_NUMBERS.length;
        const targetAngle = -(winningIndex * anglePerSegment);
        const randomOffset = (Math.random() - 0.5) * anglePerSegment * 0.9;
        
        const fullSpins = 5 * 360;
        const finalWheelRotation = wheelRotation - (wheelRotation % 360) + fullSpins + targetAngle + randomOffset;
        
        const ballOrbitSpins = 12;
        const finalAngle = targetAngle + randomOffset;
        const finalBallOrbitRotation = ballOrbitRotation - (ballOrbitRotation % 360) - (ballOrbitSpins * 360) + finalAngle;

        setWheelAnimation({
            '--wheel-start-angle': `${wheelRotation}deg`,
            '--wheel-final-angle': `${finalWheelRotation}deg`,
            animation: 'roulette-wheel-spin-final 7.5s cubic-bezier(0.23, 1, 0.32, 1) forwards'
        } as React.CSSProperties);

        setBallAnimation({
            orbiting: {
                '--ball-orbit-start-angle': `${ballOrbitRotation}deg`,
                '--ball-orbit-angle': `${finalBallOrbitRotation}deg`,
                animation: `roulette-ball-orbit-and-fade 7s cubic-bezier(0.1, 0.5, 0.2, 1) forwards`
            } as React.CSSProperties,
            settling: {
                transform: `rotate(${finalAngle}deg)`,
                animation: `roulette-ball-settle-in-pocket 1s cubic-bezier(0.5, 1, 0.5, 1) 6.5s forwards`
            }
        });

        setWheelRotation(finalWheelRotation);
        setBallOrbitRotation(finalBallOrbitRotation);

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
            const maxInterval = 600;
            const nextInterval = minInterval + (maxInterval - minInterval) * easedProgress;
            soundTimeoutRef.current = setTimeout(playTickingSound, nextInterval);
        };
        playTickingSound();

        setTimeout(async () => {
            if (!isMounted.current) return;
            setGamePhase('result');
            const winningSpots = numberToBetSpots(winner);
            let totalWinnings = 0;
            for (const spot in bets) {
                const isStraightWin = parseInt(spot) === winner;
                if (isStraightWin) {
                    totalWinnings += bets[spot] * (PAYOUTS['straight'] + 1);
                } else if (winningSpots.includes(spot)) {
                    totalWinnings += bets[spot] * (PAYOUTS[spot] + 1);
                }
            }

            if (totalWinnings > 0) {
                const netWinnings = totalWinnings - totalBet;
                setWinData({ amount: netWinnings, key: Date.now() });
                playSound('roulette_win');
                await adjustBalance(totalWinnings);
            } else {
                playSound('lose');
            }

            setTimeout(() => {
                if(isMounted.current) {
                    setGamePhase('betting');
                    setBets({});
                    setBetHistory([]);
                    setWinningNumber(null);
                    setWheelAnimation({ transform: `rotate(${finalWheelRotation}deg)` });
                    setBallAnimation({orbiting: {}, settling: {}});
                }
            }, 3000);
        }, 7500);
    };

    const handleUndo = () => {
        if (betHistory.length === 0) return;
        const lastBet = betHistory[betHistory.length - 1];
        setBets(prev => ({ ...prev, [lastBet.spot]: prev[lastBet.spot] - lastBet.amount }));
        setBetHistory(prev => prev.slice(0, -1));
    };

    const handleClear = () => setBets({});
    const handleRebet = () => setBets(lastBets);
    
    return (
        <div className="bg-gray-900 h-screen flex flex-col font-poppins text-white select-none overflow-hidden">
            {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
            <header className="flex items-center justify-between p-3 bg-gray-800/50 shrink-0">
                <div className="flex-1 flex items-center gap-4">
                    <button onClick={onBack}><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold uppercase text-red-500">Roulette</h1>
                </div>
                <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5"><span className="text-base font-bold">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span></div>
                <div className="flex-1 flex justify-end items-center space-x-3 text-sm"><button onClick={() => setIsRulesModalOpen(true)}><GameRulesIcon className="w-5 h-5"/></button></div>
            </header>

            <main className="flex-grow p-4 flex flex-col items-center justify-center gap-4">
                 <div className="relative w-96 h-96">
                    <div className="absolute inset-0 rounded-full bg-gray-800 shadow-inner"></div>
                    <div className="absolute inset-[2%] rounded-full bg-gray-900"></div>

                    <div className="absolute inset-[5%] rounded-full" style={wheelAnimation}>
                        {WHEEL_NUMBERS.map((num, i) => {
                            const angle = (360 / 37) * i;
                            const color = getNumberColor(num);
                            return (
                                <React.Fragment key={`pocket-${i}`}>
                                    <div className="absolute w-full h-full" style={{ transform: `rotate(${angle}deg)`}}>
                                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[26px] h-[171px] origin-bottom ${color === 'red' ? 'bg-red-700' : color === 'black' ? 'bg-gray-900' : 'bg-green-600'}`} style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)'}}>
                                            <span className="absolute top-3 left-1/2 -translate-x-1/2 text-sm font-bold">{num}</span>
                                        </div>
                                    </div>
                                     <div className="absolute w-full h-full" style={{ transform: `rotate(${angle - (360 / 37 / 2)}deg)`}}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-600/50 origin-bottom"></div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                         <div className="absolute inset-[30%] rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center text-4xl font-bold shadow-2xl">
                           {gamePhase === 'result' && winningNumber !== null ? winningNumber : ''}
                         </div>
                    </div>

                    <div className="absolute inset-[5%] rounded-full">
                         {gamePhase === 'spinning' && (
                             <>
                                <div className="absolute inset-0" style={ballAnimation.orbiting}>
                                    <div className="absolute top-[calc(50%-45%)] left-[calc(50%-5px)] w-[10px] h-[10px] transform-gpu">
                                        <div className="w-[10px] h-[10px] bg-white rounded-full shadow-lg"></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0" style={ballAnimation.settling}>
                                    <div className="absolute top-[calc(50%-5px)] left-[calc(50%-5px)] w-[10px] h-[10px] transform-gpu">
                                        <div className="w-[10px] h-[10px] bg-white rounded-full shadow-lg"></div>
                                    </div>
                                </div>
                             </>
                         )}
                    </div>
                </div>
                
                <div className="w-full max-w-4xl text-xs">
                    <div className="grid grid-cols-[auto_repeat(12,minmax(0,1fr))_auto] gap-1">
                        <div className="row-span-3"><BetNumber num={0} onBet={handlePlaceBet} betAmount={bets[0]} className="h-full" /></div>
                        {Array.from({length: 3}).map((_, rowIndex) => (
                           <React.Fragment key={rowIndex}>
                                {Array.from({length: 12}).map((_, colIndex) => {
                                    const num = (colIndex * 3) + (3 - rowIndex);
                                    return <BetNumber key={num} num={num} onBet={handlePlaceBet} betAmount={bets[num]} />;
                                })}
                                <BetArea label="2 to 1" onBet={() => handlePlaceBet(`col${3 - rowIndex}`)} betAmount={bets[`col${3 - rowIndex}`]} />
                           </React.Fragment>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                        <BetArea label="1st 12" onBet={() => handlePlaceBet('dozen1')} betAmount={bets.dozen1} />
                        <BetArea label="2nd 12" onBet={() => handlePlaceBet('dozen2')} betAmount={bets.dozen2} />
                        <BetArea label="3rd 12" onBet={() => handlePlaceBet('dozen3')} betAmount={bets.dozen3} />
                    </div>
                    <div className="grid grid-cols-6 gap-1 mt-1">
                        <BetArea label="1-18" onBet={() => handlePlaceBet('low')} betAmount={bets.low}/>
                        <BetArea label="Even" onBet={() => handlePlaceBet('even')} betAmount={bets.even}/>
                        <BetArea label="Red" className="!bg-red-600/80" onBet={() => handlePlaceBet('red')} betAmount={bets.red}/>
                        <BetArea label="Black" className="!bg-gray-800/80" onBet={() => handlePlaceBet('black')} betAmount={bets.black}/>
                        <BetArea label="Odd" onBet={() => handlePlaceBet('odd')} betAmount={bets.odd}/>
                        <BetArea label="High" onBet={() => handlePlaceBet('high')} betAmount={bets.high}/>
                    </div>
                </div>
            </main>

            <footer className="shrink-0 bg-gray-800/50 p-2">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-between roulette-footer">
                    <div className="flex items-center gap-2 roulette-chips">
                        {CHIP_DATA.map(({value, imageUrl}) => (
                            <button key={value} onClick={() => setSelectedChip(value)} className={`w-12 h-12 rounded-full transition-all shrink-0 ${selectedChip === value ? 'ring-4 ring-yellow-400 scale-110' : ''}`}>
                                <img src={imageUrl} alt={`${value} chip`} className="w-full h-full"/>
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-900/50 rounded-md px-4 py-2 text-center">
                        <p className="text-xs text-gray-400">Total Bet</p>
                        <p className="font-bold text-lg">{totalBet.toFixed(2)} EUR</p>
                    </div>
                    <div className="flex items-center gap-2 roulette-actions">
                        <button onClick={handleUndo} className="p-3 bg-gray-700 rounded-md"><UndoIcon className="w-6 h-6"/></button>
                        <button onClick={handleClear} className="p-3 bg-gray-700 rounded-md"><ClearIcon className="w-6 h-6"/></button>
                        <button onClick={handleRebet} className="p-3 bg-gray-700 rounded-md"><RebetIcon className="w-6 h-6"/></button>
                        <button onClick={handleSpin} disabled={gamePhase !== 'betting' || totalBet === 0} className="px-12 py-3 text-xl font-bold rounded-md bg-green-500 hover:bg-green-600 disabled:bg-gray-600 spin-btn">SPIN</button>
                    </div>
                </div>
            </footer>
             <RouletteRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
        </div>
    );
};

export default RouletteGame;