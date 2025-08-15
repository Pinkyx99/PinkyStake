

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import MinesTileIcon from '../icons/MinesTileIcon';
import GemIcon from '../icons/GemIcon';
import MineIcon from '../icons/MineIcon';
import { useUser } from '../../contexts/UserContext';
import { useSound } from '../../hooks/useSound';

const GRID_SIZE = 25;
const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const RTP = 0.99;

type GridItem = {
  type: 'gem' | 'mine';
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

interface MinesGameProps {
  onBack: () => void;
}

const MinesGame: React.FC<MinesGameProps> = ({ onBack }) => {
  const { profile, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(5.0);
  const [betInput, setBetInput] = useState(betAmount.toFixed(2));
  const [minesCount, setMinesCount] = useState(5);
  const [gameState, setGameState] = useState<GameState>('config');
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [winnings, setWinnings] = useState(0);
  const [nextWin, setNextWin] = useState(0);
  const [timer, setTimer] = useState(0);
  const isMounted = useRef(true);
  const { playSound } = useSound();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

  const isGameInProgress = gameState === 'playing';
  const revealedGems = useMemo(() => grid.filter(c => c.revealed && c.type === 'gem').length, [grid]);
  
  useEffect(() => {
    setBetInput(betAmount.toFixed(2));
  }, [betAmount]);

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetInput(e.target.value);
  };

  const handleBetInputBlur = () => {
    let value = parseFloat(betInput);
    if (isNaN(value) || value < MIN_BET) {
      value = MIN_BET;
    } else if (value > MAX_BET) {
      value = MAX_BET;
    }
    setBetAmount(value);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isGameInProgress) {
      interval = setInterval(() => {
        if (isMounted.current) {
          setTimer(prev => prev + 1);
        }
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isGameInProgress]);

  const formatTime = (seconds: number) => {
    const s = (seconds % 60).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  const calculateTotalMultiplier = useCallback((picks: number) => {
    if (picks === 0) return 0;
    const gemsCount = GRID_SIZE - minesCount;
    let rawMultiplier = 1;
    for (let i = 0; i < picks; i++) {
        const remainingTiles = GRID_SIZE - i;
        const remainingGems = gemsCount - i;
        if (remainingGems <= 0) return 0; // Should not happen in a valid game
        rawMultiplier *= (remainingTiles / remainingGems);
    }
    return rawMultiplier * RTP;
  }, [minesCount]);
  
  useEffect(() => {
    if (gameState === 'playing') {
      const currentMultiplier = revealedGems > 0 ? calculateTotalMultiplier(revealedGems) : 0;
      const nextMultiplier = calculateTotalMultiplier(revealedGems + 1);
      setWinnings(betAmount * currentMultiplier);
      setNextWin(betAmount * nextMultiplier);
    }
  }, [grid, gameState, betAmount, revealedGems, calculateTotalMultiplier]);

  const createGrid = useCallback(() => {
    const items: ('gem' | 'mine')[] = Array(GRID_SIZE).fill('gem');
    for (let i = 0; i < minesCount; i++) {
      items[i] = 'mine';
    }
    const shuffledItems = shuffle(items);
    setGrid(shuffledItems.map(type => ({ type, revealed: false })));
  }, [minesCount]);

  const handleBet = () => {
    if (!profile || betAmount > profile.balance) return;
    
    playSound('bet');
    adjustBalance(-betAmount);

    if (!isMounted.current) return;
    setGameState('playing');
    createGrid();
     // Calculate initial nextWin
    const nextMultiplier = calculateTotalMultiplier(1);
    setNextWin(betAmount * nextMultiplier);
    setWinnings(0);
  };

  const handleCashout = () => {
    if (!isGameInProgress || revealedGems === 0) return;
    
    playSound('cashout');
    adjustBalance(winnings);

    if (!isMounted.current) return;
    setGameState('cashed_out');
    setGrid(prevGrid => prevGrid.map(item => ({ ...item, revealed: true })));
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

    const newGrid = [...grid];
    newGrid[index] = { ...newGrid[index], revealed: true };

    if (newGrid[index].type === 'mine') {
      playSound('pop');
      setGameState('busted');
      const finalGrid = newGrid.map(item => ({ ...item, revealed: true }));
      setGrid(finalGrid);
    } else {
      playSound('reveal');
      setGrid(newGrid);
    }
  };

  const canBet = profile && betAmount <= profile.balance;

  const actionButton = useMemo(() => {
    if (gameState === 'playing') {
      return (
        <button onClick={handleCashout} disabled={revealedGems === 0} className="w-full h-full text-lg font-bold rounded-md transition-all uppercase text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed">
          Cashout <br />
          <span className="text-base">{winnings.toFixed(2)} EUR</span>
        </button>
      );
    }
    if (gameState === 'cashed_out' || gameState === 'busted') {
      return (
        <button onClick={handlePlayAgain} className="w-full h-full text-xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase">
          Bet
        </button>
      );
    }
    return (
      <button onClick={handleBet} disabled={!canBet} className="w-full h-full text-xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
        Bet
      </button>
    );
  }, [gameState, winnings, revealedGems, canBet, handleBet, handleCashout, handlePlayAgain]);

  const gemsCount = GRID_SIZE - minesCount;
  const isConfigPhase = gameState === 'config';

  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white select-none">
      <header className="flex items-center justify-between p-3 bg-[#1a1b2f]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="text-yellow-400 text-xl font-bold uppercase">Mines</h1>
        </div>
        <div className="flex items-center bg-black/30 rounded-md px-4 py-1.5">
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
        <div className="w-full max-w-xl">
          <div className="grid grid-cols-5 gap-3 md:gap-4">
            {(grid.length > 0 ? grid : Array(GRID_SIZE).fill(null)).map((item, index) => (
              <div key={index} className={`tile aspect-square ${item?.revealed ? 'revealed' : ''} ${isGameInProgress && !item?.revealed ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}`} onClick={() => handleTileClick(index)}>
                <div className="tile-inner">
                  <div className="tile-front bg-[#21243e] flex items-center justify-center rounded-md p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <MinesTileIcon className="w-full h-full object-contain" />
                  </div>
                  <div className={`tile-back rounded-md flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] bg-[#21243e]`}>
                    {item && (item.type === 'gem' ? <GemIcon className="w-full h-full object-contain animate-chicken-reveal" /> : <MineIcon className="w-full h-full object-contain animate-bone-reveal" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-8 mt-6 text-gray-300 font-semibold">
             <div className="flex items-center gap-2"><span>{minesCount}</span><span>x</span><MineIcon className="w-6 h-6 object-contain"/></div>
             <div className="flex items-center gap-2"><span>{gemsCount}</span><span>x</span><GemIcon className="w-6 h-6 object-contain"/></div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="bg-[#21243e] p-2 rounded-md text-center w-40">
              <p className="text-xs text-gray-400">Next Tile Win</p>
              <p className="font-bold text-base">{isGameInProgress ? `${nextWin.toFixed(2)} EUR` : '—'}</p>
            </div>
            <div className="bg-[#21243e] p-2 rounded-md text-center w-40">
              <p className="text-xs text-gray-400">Total Win</p>
              <p className="font-bold text-base text-yellow-400">{isGameInProgress && revealedGems > 0 ? `${winnings.toFixed(2)} EUR` : '—'}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
        <div className="w-full max-w-xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
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
                    <label className="text-xs font-semibold text-gray-400 mb-1 block text-left ml-1">Mines</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <input type="number" readOnly value={minesCount} className="flex-grow w-full bg-transparent text-center font-bold text-base" />
                        <div className="flex flex-col">
                            <button onClick={() => setMinesCount(v => Math.min(24, v + 1))} disabled={!isConfigPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronUpIcon className="w-3 h-3" /></button>
                            <button onClick={() => setMinesCount(v => Math.max(3, v - 1))} disabled={!isConfigPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronDownIcon className="w-3 h-3" /></button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-1">Initial multiplier ({calculateTotalMultiplier(1).toFixed(2)}x)</p>
                </div>
            </div>
            <div className="w-full md:w-48 h-14 md:h-auto">{actionButton}</div>
        </div>
      </footer>
    </div>
  );
};

export default MinesGame;