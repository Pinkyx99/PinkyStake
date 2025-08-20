import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useSound } from '../../hooks/useSound';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import GemIcon from '../icons/GemIcon';
import MineIcon from '../icons/MineIcon';
import MinesTileIcon from '../icons/MinesTileIcon';
import WinAnimation from '../WinAnimation';

const GRID_SIZE = 25;
const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const MIN_MINES = 1;
const MAX_MINES = 24;

type Tile = {
  type: 'gem' | 'mine';
  revealed: boolean;
};
type GameState = 'betting' | 'playing' | 'busted';

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const MinesGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [betAmount, setBetAmount] = useState(5.00);
    const [betInput, setBetInput] = useState(betAmount.toFixed(2));
    const [mineCount, setMineCount] = useState(5);
    const [grid, setGrid] = useState<Tile[]>([]);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const { playSound } = useSound();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => setBetInput(betAmount.toFixed(2)), [betAmount]);
    const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setBetInput(e.target.value);
    const handleBetInputBlur = () => {
        let value = parseFloat(betInput);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        else if (value > MAX_BET) value = MAX_BET;
        setBetAmount(value);
    };

    const gemsFound = useMemo(() => grid.filter(t => t.revealed && t.type === 'gem').length, [grid]);
    const gemsRemaining = useMemo(() => GRID_SIZE - mineCount - gemsFound, [mineCount, gemsFound]);

    const { currentMultiplier, nextMultiplier, currentWinnings } = useMemo(() => {
        const calculateMultiplier = (picks: number) => {
            if (picks === 0) return 1;
            let multiplier = 1;
            for (let i = 0; i < picks; i++) {
                multiplier *= (1 - 0.01) * GRID_SIZE / (GRID_SIZE - mineCount - i);
            }
            return multiplier;
        };

        const currentMult = calculateMultiplier(gemsFound);
        const nextMult = calculateMultiplier(gemsFound + 1);

        return {
            currentMultiplier: currentMult,
            nextMultiplier: nextMult,
            currentWinnings: betAmount * currentMult,
        };
    }, [gemsFound, mineCount, betAmount]);

    const handleBet = async () => {
        if (!profile || betAmount > profile.balance) return;
        
        playSound('bet');
        await adjustBalance(-betAmount);
        if (!isMounted.current) return;
        
        const newGrid: Tile[] = Array(GRID_SIZE).fill(null).map(() => ({ type: 'gem', revealed: false }));
        for(let i=0; i<mineCount; i++) newGrid[i].type = 'mine';
        
        setGrid(shuffle(newGrid));
        setGameState('playing');
    };

    const handleTileClick = (index: number) => {
        if (gameState !== 'playing' || grid[index].revealed) return;

        const tile = grid[index];
        const newGrid = [...grid];
        newGrid[index].revealed = true;
        
        if (tile.type === 'mine') {
            playSound('pop');
            setGrid(newGrid.map(t => ({...t, revealed: true})));
            setGameState('busted');
            setTimeout(() => {
                if (isMounted.current) {
                    setGameState('betting');
                    setGrid([]);
                }
            }, 3000);
        } else {
            playSound('reveal');
            setGrid(newGrid);
        }
    };

    const handleCashout = async () => {
        if (gameState !== 'playing' || gemsFound === 0) return;
        
        playSound('cashout');
        const netWinnings = currentWinnings - betAmount;
        if(netWinnings > 0) {
            setWinData({ amount: netWinnings, key: Date.now() });
        }
        await adjustBalance(currentWinnings);
        if (!isMounted.current) return;
        
        setGrid(grid.map(t => ({...t, revealed: true})));
        setGameState('busted'); // Use busted state to show grid and disable actions
        
        setTimeout(() => {
            if (isMounted.current) {
                setGameState('betting');
                setGrid([]);
            }
        }, 3000);
    };
    
    const isBettingPhase = gameState === 'betting';
    const canBet = profile && betAmount <= profile.balance;
    const canCashout = gameState === 'playing' && gemsFound > 0;

    return (
        <div className="bg-slate-900 min-h-screen flex flex-col font-poppins text-white select-none">
            {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
             <header className="shrink-0 w-full bg-[#1a1b2f] p-3 flex items-center justify-between z-10">
                <div className="flex-1 flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-purple-400 text-xl font-bold uppercase">Mines</h1>
                </div>
                <div className="flex-1 flex justify-center bg-black/30 rounded-md px-4 py-1.5"><span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span></div>
                <div className="flex-1 flex justify-end items-center space-x-3 text-sm"><button><GameRulesIcon className="w-5 h-5"/></button></div>
            </header>

            <div className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
                <div className="w-full lg:w-80 shrink-0 bg-[#1a1b2f] rounded-lg p-4 flex flex-col gap-4">
                     <div>
                        <label className="text-xs text-gray-400 mb-1 block">Bet Amount</label>
                        <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                            <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><MinusIcon className="w-4 h-4"/></button>
                            <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isBettingPhase} className="w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                            <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><PlusIcon className="w-4 h-4"/></button>
                        </div>
                     </div>
                     <div>
                        <label className="text-xs text-gray-400 mb-1 block">Mines</label>
                         <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                            <button onClick={() => setMineCount(c => Math.max(MIN_MINES, c - 1))} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><MinusIcon className="w-4 h-4"/></button>
                            <input type="number" value={mineCount} readOnly className="w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                            <button onClick={() => setMineCount(c => Math.min(MAX_MINES, c + 1))} disabled={!isBettingPhase} className="p-2 disabled:opacity-50"><PlusIcon className="w-4 h-4"/></button>
                        </div>
                        <input type="range" min={MIN_MINES} max={MAX_MINES} value={mineCount} onChange={e => setMineCount(Number(e.target.value))} disabled={!isBettingPhase} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2 disabled:opacity-50" />
                     </div>
                     <div className="flex-grow">
                        {isBettingPhase ? (
                            <button onClick={handleBet} disabled={!canBet} className="w-full h-full text-xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">Bet</button>
                        ) : (
                            <button onClick={handleCashout} disabled={!canCashout} className="w-full h-full text-lg font-bold rounded-md bg-yellow-500 hover:bg-yellow-600 transition-colors text-black uppercase disabled:bg-yellow-500/50 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight">
                                Cashout
                                <span className="text-base">{currentWinnings.toFixed(2)} EUR</span>
                            </button>
                        )}
                     </div>
                     <div className="bg-slate-800/50 p-3 rounded-lg text-center space-y-2">
                        <div><p className="text-xs text-gray-400">Gems Found</p><p className="text-lg font-bold">{gemsFound}</p></div>
                        <div><p className="text-xs text-gray-400">Next Multiplier</p><p className="text-lg font-bold text-purple-400">{nextMultiplier.toFixed(2)}x</p></div>
                     </div>
                </div>

                <div className="flex-grow flex items-center justify-center bg-[#1a1b2f] rounded-lg p-4">
                    <div className="w-full max-w-xl aspect-square grid grid-cols-5 gap-3">
                         {(grid.length > 0 ? grid : Array(GRID_SIZE).fill(null)).map((tile, i) => (
                             <div key={i} className={`mines-tile ${tile?.revealed ? 'revealed' : ''} ${gameState === 'playing' && !tile?.revealed ? 'cursor-pointer hover:scale-105' : ''} transition-transform`} onClick={() => handleTileClick(i)}>
                                <div className="mines-tile-inner">
                                    <div className="mines-tile-front bg-[#21243e] flex items-center justify-center rounded-md shadow-inner">
                                        <MinesTileIcon className="w-full h-full object-contain p-2" />
                                    </div>
                                    <div className={`mines-tile-back rounded-md flex items-center justify-center shadow-inner ${tile?.type === 'gem' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                        {tile && (tile.type === 'gem' ? <GemIcon className="w-10 h-10 animate-gem-reveal" /> : <MineIcon className="w-10 h-10 animate-mine-reveal" />)}
                                    </div>
                                </div>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinesGame;