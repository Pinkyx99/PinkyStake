import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PlusIcon from '../icons/PlusIcon.tsx';
import MinusIcon from '../icons/MinusIcon.tsx';
import ChevronUpIcon from '../icons/ChevronUpIcon.tsx';
import ChevronDownIcon from '../icons/ChevronDownIcon.tsx';
import SoundOnIcon from '../icons/SoundOnIcon.tsx';
import GameRulesIcon from '../icons/GameRulesIcon.tsx';
import ArrowLeftIcon from '../icons/ArrowLeftIcon.tsx';
import useAnimatedBalance from '../../hooks/useAnimatedBalance.tsx';
import ClocheIcon from '../icons/ClocheIcon.tsx';
import ChickenIcon from '../icons/ChickenIcon.tsx';
import BoneIcon from '../icons/BoneIcon.tsx';
import { useUser } from '../../contexts/UserContext.tsx';
import { useSound } from '../../hooks/useSound.ts';
import WinAnimation from '../WinAnimation.tsx';

const GRID_SIZE = 25;
const MIN_BET = 0.20;
const MAX_BET = 1000.00;

// Payouts based on user-provided table. Format: PAYOUTS[boneCount][picks]
const CHICKEN_PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 1.03, 2: 1.08, 3: 1.12, 4: 1.18, 5: 1.24, 6: 1.30, 7: 1.37, 8: 1.46, 9: 1.55, 10: 1.65, 11: 1.77, 12: 1.90, 13: 2.06, 14: 2.25, 15: 2.47, 16: 2.75, 17: 3.09, 18: 3.54, 19: 4.12, 20: 4.95, 21: 6.19, 22: 8.25, 23: 12.37, 24: 24.75 },
  2: { 1: 1.08, 2: 1.17, 3: 1.29, 4: 1.41, 5: 1.56, 6: 1.74, 7: 1.94, 8: 2.18, 9: 2.47, 10: 2.83, 11: 3.26, 12: 3.81, 13: 4.50, 14: 5.40, 15: 6.60, 16: 8.25, 17: 10.61, 18: 14.14, 19: 19.80, 20: 29.70, 21: 49.50, 22: 99, 23: 297 },
  3: { 1: 1.12, 2: 1.29, 3: 1.48, 4: 1.71, 5: 2.00, 6: 2.35, 7: 2.79, 8: 3.35, 9: 4.07, 10: 5.00, 11: 6.26, 12: 7.96, 13: 10.35, 14: 13.80, 15: 18.97, 16: 27.11, 17: 40.66, 18: 65.06, 19: 113.85, 20: 227.70, 21: 596.25, 22: 2277 },
  4: { 1: 1.18, 2: 1.41, 3: 1.71, 4: 2.09, 5: 2.58, 6: 3.23, 7: 4.09, 8: 5.26, 9: 6.88, 10: 9.17, 11: 12.51, 12: 17.52, 13: 25.30, 14: 37.95, 15: 59.64, 16: 99.39, 17: 178.91, 18: 357.81, 19: 834.90, 20: 2504.70, 21: 12523.50 },
  5: { 1: 1.24, 2: 1.56, 3: 2.00, 4: 2.58, 5: 3.39, 6: 4.52, 7: 6.14, 8: 8.50, 9: 12.04, 10: 17.52, 11: 26.27, 12: 40.87, 13: 66.41, 14: 113.85, 15: 208.72, 16: 417.45, 17: 939.26, 18: 2504.70, 19: 8766.45, 20: 52598.70 },
  6: { 1: 1.30, 2: 1.74, 3: 2.35, 4: 3.23, 5: 4.52, 6: 6.46, 7: 9.44, 8: 14.17, 9: 21.89, 10: 35.03, 11: 58.38, 12: 102.17, 13: 189.75, 14: 379.50, 15: 834.90, 16: 2087.25, 17: 6261.75, 18: 25047, 19: 175329 },
  7: { 1: 1.37, 2: 1.94, 3: 2.79, 4: 4.09, 5: 6.14, 6: 9.44, 7: 14.95, 8: 24.47, 9: 41.60, 10: 73.95, 11: 138.66, 12: 277.33, 13: 600.87, 14: 1442.10, 15: 3965.77, 16: 13219.25, 17: 59486.62, 18: 475893 },
  8: { 1: 1.46, 2: 2.18, 3: 3.35, 4: 5.26, 5: 8.50, 6: 14.17, 7: 24.47, 8: 44.05, 9: 83.20, 10: 166.40, 11: 356.56, 12: 831.98, 13: 2163.15, 14: 6489.45, 15: 23794.65, 16: 118973.25, 17: 1070759.25 },
  9: { 1: 1.55, 2: 2.47, 3: 4.07, 4: 6.88, 5: 12.04, 6: 21.89, 7: 41.60, 8: 83.20, 9: 176.80, 10: 404.10, 11: 1010.26, 12: 2828.73, 13: 9193.39, 14: 36773.55, 15: 202254.52, 16: 2022545.25 },
  10: { 1: 1.65, 2: 2.83, 3: 5.00, 4: 9.17, 5: 17.52, 6: 35.03, 7: 73.95, 8: 166.50, 9: 404.10, 10: 1077.61, 11: 3232.84, 12: 11314.94, 13: 49301.40, 14: 294188.40, 15: 3236072.40 },
  11: { 1: 1.77, 2: 3.26, 3: 6.26, 4: 12.51, 5: 26.27, 6: 58.38, 7: 138.66, 8: 356.56, 9: 1010.26, 10: 3232.84, 11: 12123.15, 12: 56574.69, 13: 367735.50, 14: 4412826 },
  12: { 1: 1.90, 2: 3.81, 3: 7.96, 4: 17.52, 5: 40.87, 6: 102.17, 7: 277.33, 8: 831.98, 9: 2828.73, 10: 11314.94, 11: 56574.69, 12: 396022.85, 13: 5148297 },
  13: { 1: 2.06, 2: 4.50, 3: 10.35, 4: 25.30, 5: 66.41, 6: 189.75, 7: 600.87, 8: 2163.15, 9: 9193.39, 10: 49301.40, 11: 367735.50, 12: 5148297 },
  14: { 1: 2.25, 2: 5.40, 3: 13.80, 4: 37.95, 5: 113.85, 6: 379.50, 7: 1442.10, 8: 6489.45, 9: 36773.55, 10: 294188.40, 11: 4412826 },
  15: { 1: 2.47, 2: 6.60, 3: 18.97, 4: 59.64, 5: 208.72, 6: 834.90, 7: 3965.77, 8: 23794.65, 9: 202254.52, 10: 3236072.40 },
  16: { 1: 2.75, 2: 8.25, 3: 27.11, 4: 99.39, 5: 417.45, 6: 2087.25, 7: 13219.25, 8: 118973.25, 9: 2022545.25 },
  17: { 1: 3.09, 2: 10.61, 3: 40.66, 4: 178.91, 5: 939.26, 6: 6261.75, 7: 59486.62, 8: 1070759.25 },
  18: { 1: 3.54, 2: 14.14, 3: 65.06, 4: 357.81, 5: 2504.70, 6: 25047, 7: 475893 },
  19: { 1: 4.12, 2: 19.80, 3: 113.85, 4: 834.90, 5: 8766.45, 6: 175329 },
  20: { 1: 4.95, 2: 29.70, 3: 227.70, 4: 2504.70, 5: 52598.70 },
  21: { 1: 6.19, 2: 49.50, 3: 569.25, 4: 12523.50 },
  22: { 1: 8.25, 2: 99, 3: 2277 },
  23: { 1: 12.37, 2: 297 },
  24: { 1: 24.75 }
};

type GridItem = {
  type: 'chicken' | 'bone';
  revealed: boolean;
};
type GameState = 'config' | 'playing' | 'busted' | 'cashed_out';

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface ChickenGameProps {
  onBack: () => void;
}

const ChickenGame: React.FC<ChickenGameProps> = ({ onBack }) => {
  const { user, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(5.0);
  const [betInput, setBetInput] = useState(betAmount.toFixed(2));
  const [boneCount, setBoneCount] = useState(5);
  const [gameState, setGameState] = useState<GameState>('config');
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [winnings, setWinnings] = useState(0);
  const [nextWin, setNextWin] = useState(0);
  const [timer, setTimer] = useState(0);
  const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

  const animatedBalance = useAnimatedBalance(user?.balance ?? 0);
  const isMounted = useRef(true);
  const { playSound } = useSound();
  const secretGrid = useRef<GridItem[]>([]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const isGameInProgress = gameState === 'playing';
  const revealedChickens = useMemo(() => grid.filter(c => c.revealed && c.type === 'chicken').length, [grid]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isGameInProgress) {
      interval = setInterval(() => { if (isMounted.current) { setTimer(prev => prev + 1); } }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isGameInProgress]);
  
  useEffect(() => {
    setBetInput(betAmount.toFixed(2));
  }, [betAmount]);

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetInput(e.target.value);
  };

  const handleBetInputBlur = () => {
    let value = parseFloat(betInput);
    if (isNaN(value) || value < MIN_BET) value = MIN_BET;
    else if (value > MAX_BET) value = MAX_BET;
    setBetAmount(value);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  const { currentWinnings, nextWinValue } = useMemo(() => {
    if (gameState !== 'playing') {
        return { currentWinnings: 0, nextWinValue: 0 };
    }
    const payoutTier = CHICKEN_PAYOUTS[boneCount];
    if (!payoutTier) {
        return { currentWinnings: 0, nextWinValue: 0 };
    }
    const currentMultiplier = revealedChickens > 0 ? (payoutTier[revealedChickens] || 0) : 0;
    const currentWinningsValue = betAmount * currentMultiplier;
    
    const nextMultiplier = payoutTier[revealedChickens + 1] || 0;
    const nextWinnings = betAmount * nextMultiplier;

    return { currentWinnings: currentWinningsValue, nextWinValue: nextWinnings };
  }, [gameState, grid, boneCount, betAmount, revealedChickens]);

  useEffect(() => {
      setWinnings(currentWinnings);
      setNextWin(nextWinValue);
  }, [currentWinnings, nextWinValue]);

  useEffect(() => {
    if (gameState === 'busted' || gameState === 'cashed_out') {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setGrid(secretGrid.current.map(tile => ({ ...tile, revealed: true })));
        }
      }, gameState === 'busted' ? 800 : 100);
      return () => clearTimeout(timer);
    }
  }, [gameState]);


  const createGrid = useCallback(() => {
    const items: ('chicken' | 'bone')[] = Array(GRID_SIZE).fill('chicken');
    for (let i = 0; i < boneCount; i++) {
      items[i] = 'bone';
    }
    const shuffledItems = shuffle(items);
    secretGrid.current = shuffledItems.map(type => ({ type, revealed: false }));
    // Set a placeholder grid for rendering that doesn't reveal the answers
    setGrid(Array(GRID_SIZE).fill({ type: 'chicken', revealed: false }));
  }, [boneCount]);

  const handleBet = async () => {
    if (!user || betAmount > user.balance) return;
    
    playSound('bet');
    await adjustBalance(-betAmount);

    if (!isMounted.current) return;
    setGameState('playing');
    createGrid();
  };

  const handleCashout = async () => {
    if (!isGameInProgress || revealedChickens === 0) return;
    
    playSound('cashout');
    setWinData({ amount: winnings, key: Date.now() });
    await adjustBalance(winnings);
    
    if (!isMounted.current) return;
    setGameState('cashed_out');
  };
  
  const handlePlayAgain = () => {
    playSound('click');
    setGameState('config');
    setGrid([]);
    setWinnings(0);
    setNextWin(0);
  };

  const handleTileClick = (index: number) => {
    if (!isGameInProgress || grid[index].revealed) return;

    const actualTile = secretGrid.current[index];
    const newGrid = [...grid];
    newGrid[index] = { ...actualTile, revealed: true };
    setGrid(newGrid);

    if (actualTile.type === 'bone') {
      playSound('pop');
      setGameState('busted');
    } else {
      playSound('reveal');
    }
  };

  const canBet = user && betAmount <= user.balance;

  const actionButton = useMemo(() => {
    const baseButtonClass = "w-full h-full text-lg font-bold rounded-md transition-all uppercase";
    const disabledClass = "disabled:bg-gray-500/50 disabled:cursor-not-allowed";

    if (gameState === 'playing') {
      return (
        <button
          onClick={handleCashout}
          disabled={revealedChickens === 0}
          className={`${baseButtonClass} text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600/50`}
        >
          Cashout <br />
          <span className="text-base font-semibold">{winnings.toFixed(2)} EUR</span>
        </button>
      );
    }
    if (gameState === 'cashed_out' || gameState === 'busted') {
      const message = gameState === 'busted' ? 'You Busted!' : `Cashed Out ${winnings.toFixed(2)} EUR!`;
      return (
         <div className="relative w-full h-full">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 px-4 py-1 rounded-md text-white font-semibold whitespace-nowrap animate-pulse">{message}</div>
            <button
                onClick={handlePlayAgain}
                className={`${baseButtonClass} text-black bg-[#9dff00] hover:bg-[#8ee000]`}
            >
                Play Again
            </button>
         </div>
      );
    }
    // For 'config' state
    return (
      <button
        onClick={handleBet}
        disabled={!canBet}
        className={`${baseButtonClass} text-black bg-[#9dff00] hover:bg-[#8ee000] ${disabledClass}`}
      >
        Bet
      </button>
    );
  }, [gameState, winnings, revealedChickens, canBet, handleBet, handleCashout, handlePlayAgain]);

  const remainingChickens = GRID_SIZE - boneCount;
  const isConfigPhase = gameState === 'config';

  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white select-none">
       {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
      <header className="shrink-0 w-full bg-[#1a1b2f] p-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
              <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                  <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <h1 className="text-red-500 text-xl font-bold uppercase">Chicken</h1>
          </div>
          <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
              <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
              <span className="text-sm text-gray-400 ml-2">EUR</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
              <span className="font-mono text-gray-400">{formatTime(timer)}</span>
              <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button>
              <button className="text-gray-400 hover:text-white flex items-center gap-1"><GameRulesIcon className="w-5 h-5"/> Game Rules</button>
          </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-slate-900/30 p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-5 gap-4 md:gap-5">
            {(grid.length > 0 ? grid : Array(GRID_SIZE).fill(null)).map((item, index) => (
              <div 
                key={index} 
                className={`tile aspect-square ${item?.revealed ? 'revealed' : ''} ${isGameInProgress && !item?.revealed ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}`} 
                onClick={() => handleTileClick(index)}
              >
                <div className="tile-inner">
                  <div className="tile-front bg-[#21243e] flex items-center justify-center rounded-md p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <ClocheIcon className="w-full h-full object-contain" />
                  </div>
                  <div className={`tile-back rounded-md flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] ${item?.type === 'chicken' ? 'bg-[#21243e]' : 'bg-red-900/20'}`}>
                    {item && item.revealed && (item.type === 'chicken' ? <ChickenIcon className="w-full h-full object-contain animate-chicken-reveal" /> : <BoneIcon className="w-full h-full object-contain animate-bone-reveal" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-8 mt-6 text-gray-300 font-semibold">
             <div className="flex items-center gap-2">
                <BoneIcon className="w-6 h-6 object-contain"/>
                <span>x</span>
                <span>{boneCount}</span>
             </div>
             <div className="flex items-center gap-2">
                <ChickenIcon className="w-6 h-6 object-contain"/>
                 <span>x</span>
                <span>{remainingChickens}</span>
             </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="bg-[#21243e] p-2 rounded-md text-center w-40">
                <p className="text-xs text-gray-400">Next Tile Win</p>
                <p className="font-bold text-base">{gameState === 'playing' ? `${nextWin.toFixed(2)} EUR` : '—'}</p>
            </div>
            <div className="bg-[#21243e] p-2 rounded-md text-center w-40">
                <p className="text-xs text-gray-400">Total Win</p>
                <p className="font-bold text-base text-yellow-400">{gameState === 'playing' && revealedChickens > 0 ? `${winnings.toFixed(2)} EUR` : '—'}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
        <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="w-48">
                    <label className="text-xs font-semibold text-gray-400 mb-1 block text-left ml-1">Bet</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded"><MinusIcon className="w-4 h-4"/></button>
                        <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isConfigPhase} className="flex-grow w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                <div className="w-40">
                    <label className="text-xs font-semibold text-gray-400 mb-1 block text-left ml-1">Bones</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <input type="number" readOnly value={boneCount} disabled={!isConfigPhase} className="flex-grow w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <div className="flex flex-col">
                            <button onClick={() => setBoneCount(v => Math.min(24, v + 1))} disabled={!isConfigPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronUpIcon className="w-3 h-3" /></button>
                            <button onClick={() => setBoneCount(v => Math.max(1, v - 1))} disabled={!isConfigPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronDownIcon className="w-3 h-3" /></button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full md:w-48 h-14 md:h-auto mt-4 md:mt-0">
                {actionButton}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default ChickenGame;