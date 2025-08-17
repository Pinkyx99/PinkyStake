


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SwitchIcon from '../icons/SwitchIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import DiceRulesModal from './dice/DiceRulesModal';
import { useUser } from '../../contexts/UserContext';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_ROLL = 2;
const MAX_ROLL = 98;
const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const RTP = 0.99; // 99% Return to Player

type Mode = 'over' | 'under';
type GamePhase = 'betting' | 'rolling' | 'result';

interface DiceGameProps {
  onBack: () => void;
}

const DiceGame: React.FC<DiceGameProps> = ({ onBack }) => {
  const { profile, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(5.00);
  const [betInput, setBetInput] = useState(betAmount.toFixed(2));
  const [mode, setMode] = useState<Mode>('over');
  const [rollValue, setRollValue] = useState(50.00);
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [lastRollResult, setLastRollResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const lastInputSource = useRef<'roll' | 'multiplier' | 'chance' | null>(null);
  const isMounted = useRef(true);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playSound } = useSound();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  const { winChance, multiplier } = useMemo(() => {
    let chance;
    if (mode === 'over') {
      chance = Math.max(0.01, 100 - rollValue);
    } else { // mode === 'under'
      chance = Math.min(99.99, rollValue);
    }
    const mult = (100 / chance) * RTP;
    return { winChance: chance, multiplier: mult };
  }, [rollValue, mode]);

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


  const updateFromRollValue = (newRoll: number) => {
    lastInputSource.current = 'roll';
    const clampedRoll = Math.max(MIN_ROLL, Math.min(MAX_ROLL, newRoll));
    setRollValue(clampedRoll);
  };

  const updateFromMultiplier = (newMultiplierStr: string) => {
    lastInputSource.current = 'multiplier';
    const newMultiplier = parseFloat(newMultiplierStr);
    if (isNaN(newMultiplier)) return;

    const minMultiplier = (100 / 98) * RTP;
    const maxMultiplier = (100 / 2) * RTP;
    const clampedMultiplier = Math.max(minMultiplier, Math.min(maxMultiplier, newMultiplier));
    
    const chance = (100 * RTP) / clampedMultiplier;
    const newRoll = mode === 'over' ? 100 - chance : chance;
    
    setRollValue(Math.max(MIN_ROLL, Math.min(MAX_ROLL, newRoll)));
  };

  const updateFromWinChance = (newChanceStr: string) => {
    lastInputSource.current = 'chance';
    const newChance = parseFloat(newChanceStr);
    if(isNaN(newChance)) return;

    const clampedChance = Math.max(2, Math.min(98, newChance));
    const newRoll = mode === 'over' ? 100 - clampedChance : clampedChance;
    setRollValue(newRoll);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const isGameInProgress = gamePhase === 'rolling';
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
  }, [gamePhase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  const handleBet = async () => {
    if (!profile || betAmount > profile.balance || gamePhase !== 'betting') return;

    await adjustBalance(-betAmount);
    playSound('bet');

    if (!isMounted.current) return;
    setGamePhase('rolling');
    setLastRollResult(null);

    rollIntervalRef.current = setInterval(() => {
      if (!isMounted.current) {
        if(rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        return;
      }
      setLastRollResult(Math.random() * 101);
    }, 50);

    tickIntervalRef.current = setInterval(() => playSound('tick'), 100);

    setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      rollIntervalRef.current = null;
      tickIntervalRef.current = null;

      if (!isMounted.current) return;

      const finalRoll = Math.random() * 101;
      setLastRollResult(finalRoll);

      const didWin = mode === 'over' ? finalRoll > rollValue : finalRoll < rollValue;
      setIsWin(didWin);
      
      if (didWin) {
        playSound('win');
        const winnings = betAmount * multiplier;
        const netWinnings = winnings - betAmount;
        setWinData({ amount: netWinnings, key: Date.now() });
        adjustBalance(winnings);
      } else {
        playSound('lose');
      }

      setGamePhase('result');

      setTimeout(() => {
        if (isMounted.current) setGamePhase('betting');
      }, 2000);
    }, 1500);
  };

  const handleToggleMode = () => {
    if (gamePhase !== 'betting') return;
    playSound('click');
    const newMode = mode === 'over' ? 'under' : 'over';
    setMode(newMode);
    setRollValue(100 - rollValue);
  };
  
  const sliderProgress = mode === 'over' ? 100 - rollValue : rollValue;

  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white select-none">
       {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
      <header className="flex items-center justify-between p-3 bg-[#1a1b2f] border-b border-gray-700/50">
        <div className="flex-1 flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="text-red-500 text-2xl font-bold uppercase">Dice</h1>
        </div>
        <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5">
          <span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
        <div className="flex-1 flex justify-end items-center space-x-4">
          <span className="font-mono text-gray-400">{formatTime(timer)}</span>
          <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white flex items-center gap-1"><GameRulesIcon className="w-5 h-5" /> Game Rules</button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl flex flex-col gap-8">
            <div className="relative h-16">
                 {/* Roll Result Indicator */}
                <div className={`absolute -top-12 transition-all duration-200 ${gamePhase === 'betting' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} style={{ left: `calc(${lastRollResult ?? 50}% - 32px)` }}>
                  <div className={`relative w-16 h-10 flex items-center justify-center rounded-md shadow-2xl ${isWin ? 'bg-green-500' : 'bg-red-600'}`}>
                    <span className="text-lg font-bold">{lastRollResult?.toFixed(2)}</span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-inherit rotate-45"></div>
                  </div>
                </div>

                {/* Slider Track */}
                <div className="relative h-4 bg-gray-700 rounded-full mt-8">
                    <div className={`absolute h-4 rounded-l-full ${mode === 'over' ? 'bg-red-600' : 'bg-green-500'}`} style={{ width: `${rollValue}%` }}></div>
                    <div className={`absolute h-4 rounded-r-full ${mode === 'under' ? 'bg-red-600' : 'bg-green-500'}`} style={{ left: `${rollValue}%`, width: `${100 - rollValue}%` }}></div>
                     {/* Slider Handle */}
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${rollValue}% - 16px)` }}>
                        <div className="relative w-8 h-8">
                        <div className="absolute w-8 h-8 bg-white rounded-full shadow-lg"></div>
                        <div className="absolute inset-0.5 bg-gray-800 rounded-full"></div>
                        <div className="absolute inset-1 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Multiplier */}
                <div className="bg-[#21243e] p-2 rounded-md">
                    <label className="text-xs text-gray-400 mb-1 block">Multiplier</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <input type="text" value={lastInputSource.current === 'multiplier' ? multiplier.toString() : multiplier.toFixed(4)} onChange={(e) => updateFromMultiplier(e.target.value)} onFocus={()=> lastInputSource.current = 'multiplier'} className="w-full bg-transparent text-center font-bold text-base outline-none" />
                        <div className="flex flex-col"><button onClick={() => updateFromMultiplier((multiplier + 0.1).toString())} disabled={gamePhase !== 'betting'} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronUpIcon className="w-3 h-3" /></button><button onClick={() => updateFromMultiplier((multiplier - 0.1).toString())} disabled={gamePhase !== 'betting'} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronDownIcon className="w-3 h-3" /></button></div>
                    </div>
                </div>

                {/* Roll Over/Under */}
                <div className="bg-[#21243e] p-2 rounded-md">
                    <label className="text-xs text-gray-400 mb-1 block">{mode === 'over' ? 'Roll Over' : 'Roll Under'}</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={handleToggleMode} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white bg-[#404566] rounded"><SwitchIcon className="w-4 h-4" /></button>
                        <input type="text" value={rollValue.toFixed(2)} onChange={(e) => updateFromRollValue(parseFloat(e.target.value))} onFocus={()=> lastInputSource.current = 'roll'} className="w-full bg-transparent text-center font-bold text-base outline-none" />
                        <div className="flex flex-col"><button onClick={() => updateFromRollValue(rollValue + 1)} disabled={gamePhase !== 'betting'} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronUpIcon className="w-3 h-3" /></button><button onClick={() => updateFromRollValue(rollValue - 1)} disabled={gamePhase !== 'betting'} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronDownIcon className="w-3 h-3" /></button></div>
                    </div>
                </div>

                {/* Win Chance */}
                <div className="bg-[#21243e] p-2 rounded-md">
                    <label className="text-xs text-gray-400 mb-1 block">Win Chance</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <input type="text" value={winChance.toFixed(2)} onChange={(e) => updateFromWinChance(e.target.value)} onFocus={()=> lastInputSource.current = 'chance'} className="w-full bg-transparent text-center font-bold text-base outline-none" />
                        <span className="text-gray-500 font-bold">%</span>
                        <div className="flex flex-col"><button onClick={() => updateFromWinChance((winChance + 1).toString())} disabled={gamePhase !== 'betting'} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronUpIcon className="w-3 h-3" /></button><button onClick={() => updateFromWinChance((winChance - 1).toString())} disabled={gamePhase !== 'betting'} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronDownIcon className="w-3 h-3" /></button></div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
        <div className="w-full max-w-xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
            {/* Bet Amount & Profit */}
            <div className="flex-grow bg-[#21243e] p-2 rounded-md flex justify-around items-center">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Bet</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#404566] rounded"><MinusIcon className="w-4 h-4"/></button>
                        <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={gamePhase !== 'betting'} className="w-24 bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                        <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={gamePhase !== 'betting'} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#404566] rounded"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Profit on Win</label>
                    <div className="p-1 h-[42px] flex items-center">
                        <p className="font-bold text-base text-green-400">{(betAmount * (multiplier - 1)).toFixed(2)} EUR</p>
                    </div>
                </div>
            </div>

            {/* Bet Button */}
            <div className="w-full md:w-48 h-14 md:h-auto">
                <button onClick={handleBet} disabled={gamePhase !== 'betting' || !profile || betAmount > profile.balance} className="w-full h-full text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Bet
                </button>
            </div>
        </div>
      </footer>
      <DiceRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
};

export default DiceGame;