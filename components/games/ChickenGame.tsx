


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ClocheIcon from '../icons/ClocheIcon';
import ChickenIcon from '../icons/ChickenIcon';
import BoneIcon from '../icons/BoneIcon';
import { useUser } from '../../contexts/UserContext';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const GRID_SIZE = 25;
const MIN_BET = 0.20;
const MAX_BET = 1000.00;

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
  const { profile, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(5.0);
  const [betInput, setBetInput] = useState(betAmount.toFixed(2));
  const [boneCount, setBoneCount] = useState(5);
  const [gameState, setGameState] = useState<GameState>('config');
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [winnings, setWinnings] = useState(0);
  const [nextWin, setNextWin] = useState(0);
  const [timer, setTimer] = useState(0);
  const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const isMounted = useRef(true);
  const { playSound } = useSound();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isGameInProgress = gameState === 'playing';
  const revealedChickens = useMemo(() => grid.filter(c => c.revealed && c.type === 'chicken').length, [grid]);

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

  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  const calculateMultiplier = useCallback((chickensToFind: number, totalBones: number, revealed: number) => {
      const totalTiles = 25;
      const remainingTiles = totalTiles - revealed;
      if (remainingTiles <= totalBones) return 0; // Not possible to win anymore
      return (1 - totalBones / remainingTiles) ** -1;
  }, []);

  const updateWinnings = useCallback(() => {
    const chickensFound = grid.filter(c => c.revealed && c.type === 'chicken').length;
    if (chickensFound === 0) {
        const nextMultiplier = calculateMultiplier(GRID_SIZE - boneCount, boneCount, 0);
        setWinnings(0);
        setNextWin(betAmount * nextMultiplier * 0.95);
        return;
    }

    let currentWinnings = betAmount;
    
    for(let i = 0; i < chickensFound; i++) {
        const multiplier = calculateMultiplier(GRID_SIZE - boneCount, boneCount, i);
        currentWinnings *= multiplier * 0.95; // Apply 5% house edge at each step
    }
    
    const nextMultiplier = calculateMultiplier(GRID_SIZE - boneCount, boneCount, chickensFound);
    const potentialNext = currentWinnings * nextMultiplier * 0.95;
    
    setWinnings(currentWinnings);
    setNextWin(potentialNext);

  }, [grid, betAmount, boneCount, calculateMultiplier]);
  
  useEffect(() => {
    if (gameState === 'playing') {
      updateWinnings();
    }
  }, [grid, gameState, updateWinnings]);


  const createGrid = useCallback(() => {
    const items: ('chicken' | 'bone')[] = Array(GRID_SIZE).fill('chicken');
    for (let i = 0; i < boneCount; i++) {
      items[i] = 'bone';
    }
    const shuffledItems = shuffle(items);
    setGrid(shuffledItems.map(type => ({ type, revealed: false })));
  }, [boneCount]);

  const handleBet = async () => {
    if (!profile || betAmount > profile.balance) return;
    
    playSound('bet');
    await adjustBalance(-betAmount);

    if (!isMounted.current) return;
    setGameState('playing');
    createGrid();
    updateWinnings(); // Calculate initial nextWin
  };

  const handleCashout = async () => {
    if (!isGameInProgress || revealedChickens === 0) return;
    
    playSound('cashout');
    setWinData({ amount: winnings, key: Date.now() });
    await adjustBalance(winnings);
    
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

    if (newGrid[index].type === 'bone') {
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
        <button
          onClick={handleCashout}
          disabled={revealedChickens === 0}
          className="w-full h-full text-lg font-bold rounded-md transition-all uppercase text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed"
        >
          Cashout <br />
          <span className="text-base">{winnings.toFixed(2)} EUR</span>
        </button>
      );
    }
    if (gameState === 'cashed_out' || gameState === 'busted') {
      return (
        <button
          onClick={handlePlayAgain}
          className="w-full h-full text-xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase"
        >
          Bet
        </button>
      );
    }
    // For 'config' state
    return (
      <button
        onClick={handleBet}
        disabled={!canBet}
        className="w-full h-full text-xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed"
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
        <div className="w-full max-w-xl">
          <div className="grid grid-cols-5 gap-3 md:gap-4">
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
                  <div className={`tile-back rounded-md flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] bg-[#21243e]`}>
                    {item && (item.type === 'chicken' ? <ChickenIcon className="w-full h-full object-contain animate-chicken-reveal" /> : <BoneIcon className="w-full h-full object-contain animate-bone-reveal" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-8 mt-6 text-gray-300 font-semibold">
             <div className="flex items-center gap-2">
                <span>{boneCount}</span>
                <span>x</span>
                <BoneIcon className="w-6 h-6 object-contain"/>
             </div>
             <div className="flex items-center gap-2">
                <span>{remainingChickens}</span>
                 <span>x</span>
                <ChickenIcon className="w-6 h-6 object-contain"/>
             </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="bg-[#21243e] p-2 rounded-md text-center w-40">
                <p className="text-xs text-gray-400">Next Tile Win</p>
                <p className="font-bold text-base">{isGameInProgress ? `${nextWin.toFixed(2)} EUR` : '—'}</p>
            </div>
            <div className="bg-[#21243e] p-2 rounded-md text-center w-40">
                <p className="text-xs text-gray-400">Total Win</p>
                <p className="font-bold text-base text-yellow-400">{isGameInProgress && revealedChickens > 0 ? `${winnings.toFixed(2)} EUR` : '—'}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
        <div className="w-full max-w-xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Bet Amount */}
                <div className="w-48">
                    <label className="text-xs font-semibold text-gray-400 mb-1 block text-left ml-1">Bet</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded"><MinusIcon className="w-4 h-4"/></button>
                        <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isConfigPhase} className="flex-grow w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                {/* Bones */}
                <div className="w-40">
                    <label className="text-xs font-semibold text-gray-400 mb-1 block text-left ml-1">Bones</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <input type="number" readOnly value={boneCount} className="flex-grow w-full bg-transparent text-center font-bold text-base" />
                        <div className="flex flex-col">
                            <button onClick={() => setBoneCount(v => Math.min(24, v + 1))} disabled={!isConfigPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronUpIcon className="w-3 h-3" /></button>
                            <button onClick={() => setBoneCount(v => Math.max(1, v - 1))} disabled={!isConfigPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronDownIcon className="w-3 h-3" /></button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-1">Initial multiplier ({(calculateMultiplier(remainingChickens, boneCount, 0)).toFixed(2)}x)</p>
                </div>
            </div>
            <div className="w-full md:w-48 h-14 md:h-auto">
                {actionButton}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default ChickenGame;