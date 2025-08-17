


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import LimboRulesModal from './limbo/LimboRulesModal';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const MAX_PROFIT = 10000.00;
const MIN_MULTIPLIER = 1.01;
const MAX_MULTIPLIER = 10000.00;
const MIN_CHANCE = 0.0099;
const MAX_CHANCE = 98.01;
const RTP = 0.99;

type GamePhase = 'betting' | 'playing' | 'result';

interface LimboGameProps {
  onBack: () => void;
}

const LimboGame: React.FC<LimboGameProps> = ({ onBack }) => {
  const { profile, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(5.00);
  const [targetMultiplier, setTargetMultiplier] = useState(2.00);
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [displayResult, setDisplayResult] = useState(1.00);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);

  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const isMounted = useRef(true);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playSound } = useSound();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  const winChance = useMemo(() => (RTP * 100) / targetMultiplier, [targetMultiplier]);
  const profitOnWin = useMemo(() => betAmount * targetMultiplier, [betAmount, targetMultiplier]);

  const maxMultiplierForBet = useMemo(() => {
    if (betAmount <= 0) return MAX_MULTIPLIER;
    return Math.min(MAX_MULTIPLIER, MAX_PROFIT / betAmount);
  }, [betAmount]);

  useEffect(() => {
    if (targetMultiplier > maxMultiplierForBet) {
      setTargetMultiplier(maxMultiplierForBet);
    }
  }, [targetMultiplier, maxMultiplierForBet]);

  const handleMultiplierChange = (value: number) => {
    const clamped = Math.max(MIN_MULTIPLIER, Math.min(maxMultiplierForBet, value));
    setTargetMultiplier(clamped);
  };
  
  const handleWinChanceChange = (value: number) => {
    const clamped = Math.max(MIN_CHANCE, Math.min(MAX_CHANCE, value));
    const newMultiplier = (RTP * 100) / clamped;
    handleMultiplierChange(newMultiplier);
  };

  const handleBet = async () => {
    if (!profile || betAmount > profile.balance || gamePhase !== 'betting') return;

    await adjustBalance(-betAmount);
    playSound('bet');

    if (!isMounted.current) return;
    setGamePhase('playing');
    setIsWin(null);

    animationIntervalRef.current = setInterval(() => {
        if (!isMounted.current) return;
        setDisplayResult(Math.random() * 10);
    }, 50);
    
    tickIntervalRef.current = setInterval(() => playSound('tick'), 120);

    setTimeout(async () => {
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        if (!isMounted.current) return;

        const randomRoll = Math.random() * 100;
        const won = randomRoll < winChance;
        setIsWin(won);

        let finalResult: number;
        if (won) {
            playSound('win');
            finalResult = targetMultiplier + Math.random() * (targetMultiplier * 2);
        } else {
            playSound('lose');
            finalResult = 1.00 + Math.random() * (targetMultiplier - 1.00);
        }
        setDisplayResult(finalResult);

        if (won) {
            const netWinnings = profitOnWin - betAmount;
            setWinData({ amount: netWinnings, key: Date.now() });
            await adjustBalance(profitOnWin);
        }
        
        setGamePhase('result');
        
        setTimeout(() => {
          if (isMounted.current) {
            setGamePhase('betting');
            setIsWin(null);
            setDisplayResult(1.00);
          }
        }, 2500);

    }, 2000);
  };

  const getResultColor = () => {
    if (isWin === true) return 'text-green-400';
    if (isWin === false) return 'text-red-500';
    return 'text-white';
  };
  
  const isBettingPhase = gamePhase === 'betting';

  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white select-none">
       {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
      <header className="flex items-center justify-between p-3 bg-[#1a1b2f]">
        <div className="flex-1 flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold uppercase text-purple-400">Limbo</h1>
        </div>
        <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5">
          <span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
        <div className="flex-1 flex justify-end items-center space-x-4">
          <span className="font-mono text-gray-400">{`00:00:${timer.toString().padStart(2, '0')}`}</span>
          <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white flex items-center gap-1"><GameRulesIcon className="w-5 h-5" /> Game Rules</button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className={`text-7xl md:text-9xl font-bold transition-colors duration-300 ${getResultColor()}`} style={{textShadow: '0 0 20px currentColor'}}>
            {displayResult.toFixed(2)}
        </div>
      </main>

      <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
        <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Multiplier</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1 w-40">
                        <input type="number" value={targetMultiplier.toFixed(2)} onChange={e => handleMultiplierChange(parseFloat(e.target.value))} disabled={!isBettingPhase} className="w-full bg-transparent text-center font-bold text-base outline-none" />
                        <div className="flex flex-col"><button onClick={() => handleMultiplierChange(targetMultiplier + 0.1)} disabled={!isBettingPhase} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronUpIcon className="w-3 h-3" /></button><button onClick={() => handleMultiplierChange(targetMultiplier - 0.1)} disabled={!isBettingPhase} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronDownIcon className="w-3 h-3" /></button></div>
                    </div>
                </div>
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Win Chance</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1 w-40">
                        <input type="number" value={winChance.toFixed(2)} onChange={e => handleWinChanceChange(parseFloat(e.target.value))} disabled={!isBettingPhase} className="w-full bg-transparent text-center font-bold text-base outline-none" />
                         <span className="text-gray-400 pr-1">%</span>
                        <div className="flex flex-col"><button onClick={() => handleWinChanceChange(winChance + 1)} disabled={!isBettingPhase} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronUpIcon className="w-3 h-3" /></button><button onClick={() => handleWinChanceChange(winChance - 1)} disabled={!isBettingPhase} className="px-2 py-0.5 text-gray-400 hover:text-white disabled:text-gray-600"><ChevronDownIcon className="w-3 h-3" /></button></div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-grow">
                    <label className="text-xs text-gray-400 mb-1 block">Bet</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#404566] rounded"><MinusIcon className="w-4 h-4"/></button>
                        <input type="number" value={betAmount.toFixed(2)} onChange={e => setBetAmount(parseFloat(e.target.value))} disabled={!isBettingPhase} className="w-24 bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                        <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 bg-[#404566] rounded"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                </div>

                <div className="flex-grow">
                    <label className="text-xs text-gray-400 mb-1 block">Profit</label>
                    <div className="bg-[#2f324d] rounded-md p-1 h-[42px] flex items-center justify-center min-w-[150px]">
                        <p className="font-bold text-base text-gray-300">{profitOnWin.toFixed(2)} EUR</p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-64">
                <button onClick={handleBet} disabled={!isBettingPhase || !profile || betAmount > profile.balance} className="w-full h-14 text-2xl font-bold rounded-md bg-green-500 hover:bg-green-600 transition-colors text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Bet
                </button>
            </div>
        </div>
      </footer>
      <LimboRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
};

export default LimboGame;