


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import DoorComponent from './doors/Door';
import GameRulesModal from './doors/GameRulesModal';
import { useUser } from '../../contexts/UserContext';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

const INITIAL_DOOR_COUNT = 10;
const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const MAX_PROFIT = 10000;

type GamePhase = 'config' | 'playing' | 'reveal_zoom' | 'reveal_action' | 'reveal_fly_through' | 'lost' | 'cashed_out' | 'transitioning';
type RiskLevel = 'Low' | 'Medium' | 'High';
type Door = { id: number; type: 'safe' | 'locked'; revealed: boolean };

type SelectedDoorInfo = { door: Door; index: number; offset: number; };

const RISK_LEVELS_UI: Record<RiskLevel, { color: string }> = {
  Low: { color: 'text-green-400' },
  Medium: { color: 'text-yellow-400' },
  High: { color: 'text-red-500' },
};
const RISK_ORDER: RiskLevel[] = ['Low', 'Medium', 'High'];

// This table is derived directly from the game rules image.
const LOSING_DOORS_TABLE: Record<RiskLevel, Record<number, number>> = {
  Low:    { 10: 1, 9: 1, 8: 1, 7: 1, 6: 1, 5: 1, 4: 1, 3: 1, 2: 1 },
  Medium: { 10: 3, 9: 3, 8: 3, 7: 3, 6: 2, 5: 2, 4: 2, 3: 1, 2: 1 },
  High:   { 10: 5, 9: 5, 8: 4, 7: 4, 6: 3, 5: 3, 4: 2, 3: 2, 2: 1 },
};

const getLockedDoorCount = (risk: RiskLevel, totalDoors: number): number => {
    return LOSING_DOORS_TABLE[risk][totalDoors] || 0;
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface DoorsGameProps {
  onBack: () => void;
}

const DoorsGame: React.FC<DoorsGameProps> = ({ onBack }) => {
  const { profile, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(1.0);
  const [betInput, setBetInput] = useState(betAmount.toFixed(2));
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');
  const [gamePhase, setGamePhase] = useState<GamePhase>('config');
  const [doors, setDoors] = useState<Door[]>([]);
  const [level, setLevel] = useState(0);
  const [winnings, setWinnings] = useState(0);
  const [selectedDoor, setSelectedDoor] = useState<SelectedDoorInfo | null>(null);
  const [doorAnimationState, setDoorAnimationState] = useState<'swing' | 'thud' | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
  
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const gridRef = useRef<HTMLDivElement>(null);
  const doorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMounted = useRef(true);
  const { playSound } = useSound();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  const createDoorsForLevel = useCallback((totalDoors: number, risk: RiskLevel): Door[] => {
    const lockedDoors = getLockedDoorCount(risk, totalDoors);
    const safeDoors = totalDoors - lockedDoors;
    if (safeDoors < 0) return []; // Should not happen
    const newDoorsConfig: Omit<Door, 'revealed' | 'id'>[] = [
      ...Array(safeDoors).fill({ type: 'safe' }),
      ...Array(lockedDoors).fill({ type: 'locked' })
    ];
    return shuffle(newDoorsConfig).map((d, i) => ({ ...d, revealed: false, id: i }));
  }, []);

  useEffect(() => {
    doorRefs.current = doorRefs.current.slice(0, doors.length);
  }, [doors]);

  const calculateTotalMultiplier = useCallback((picks: number) => {
    if (picks === 0) return 1;
    
    let rawMultiplier = 1;
    for (let i = 0; i < picks; i++) {
        const totalDoors = INITIAL_DOOR_COUNT - i;
        const lockedDoors = getLockedDoorCount(riskLevel, totalDoors);
        const safeDoors = totalDoors - lockedDoors;
        
        if (safeDoors <= 0) {
            return 0; 
        }
        
        rawMultiplier *= (totalDoors / safeDoors);
    }
    
    return rawMultiplier * 0.99;
  }, [riskLevel]);


  useEffect(() => {
    if (gamePhase === 'config') {
      setDoors(createDoorsForLevel(INITIAL_DOOR_COUNT, riskLevel));
    }
  }, [gamePhase, riskLevel, createDoorsForLevel]);
  
  const handleBet = async () => {
    if (!profile || betAmount > profile.balance) return;
    
    playSound('bet');
    await adjustBalance(-betAmount);
    if (!isMounted.current) return;
    setLevel(0);
    setWinnings(0);
    setSelectedDoor(null);
    setDoorAnimationState(null);
    setDoors(createDoorsForLevel(INITIAL_DOOR_COUNT, riskLevel)); 
    setGamePhase('playing');
  };
  
  const handleDoorClick = (door: Door, index: number) => {
    if (gamePhase !== 'playing' || !gridRef.current || !doorRefs.current[index]) return;
    
    playSound('click');
    const gridRect = gridRef.current.getBoundingClientRect();
    const doorRect = doorRefs.current[index]!.getBoundingClientRect();
    const gridCenter = gridRect.left + gridRect.width / 2;
    const doorCenter = doorRect.left + doorRect.width / 2;
    const offset = doorCenter - gridCenter;

    setSelectedDoor({ door, index, offset });
    setGamePhase('reveal_zoom');
  };

  const handleCashout = async () => {
    if (gamePhase !== 'playing' || level === 0) return;
    
    playSound('cashout');
    setWinData({ amount: winnings, key: Date.now() });
    await adjustBalance(winnings);
    if (!isMounted.current) return;
    setGamePhase('cashed_out');
    setDoors(prev => prev.map(d => ({...d, revealed: true})));
  };

  useEffect(() => {
    const processGamePhase = async () => {
        if (gamePhase === 'reveal_zoom') {
          const timer = setTimeout(() => {
              if (isMounted.current) setGamePhase('reveal_action');
          }, 500); 
          return () => clearTimeout(timer);
        }
        if (gamePhase === 'reveal_action' && selectedDoor) {
          if (selectedDoor.door.type === 'safe') {
              playSound('doors_win');
          } else {
              playSound('pop');
          }
          if(isMounted.current) setDoorAnimationState(selectedDoor.door.type === 'safe' ? 'swing' : 'thud');
          const nextPhaseDelay = selectedDoor.door.type === 'safe' ? 600 : 800; 
          const timer = setTimeout(() => {
            if (isMounted.current) setGamePhase(selectedDoor.door.type === 'safe' ? 'reveal_fly_through' : 'lost');
          }, nextPhaseDelay);
          return () => clearTimeout(timer);
        }
        if (gamePhase === 'reveal_fly_through' && selectedDoor) {
          const flyThroughTimer = setTimeout(async () => {
            if (!isMounted.current) return;
            const newLevel = level + 1;
            const newWinnings = betAmount * calculateTotalMultiplier(newLevel);

            if (newWinnings >= MAX_PROFIT || newLevel >= INITIAL_DOOR_COUNT - 1) {
                const finalWinnings = Math.min(newWinnings, MAX_PROFIT);
                setWinnings(finalWinnings);
                setLevel(newLevel);
                playSound('cashout');
                setWinData({ amount: finalWinnings, key: Date.now() });
                await adjustBalance(finalWinnings);
                if (!isMounted.current) return;
                setGamePhase('cashed_out');
                setDoors(prev => prev.map(d => ({...d, revealed: true})));
            } else {
                setGamePhase('transitioning');
                const transitionTimer = setTimeout(() => {
                    if (!isMounted.current) return;
                    setLevel(newLevel);
                    setWinnings(newWinnings);
                    setDoors(createDoorsForLevel(INITIAL_DOOR_COUNT - newLevel, riskLevel));
                    setSelectedDoor(null);
                    setDoorAnimationState(null);
                    setGamePhase('playing');
                }, 800);
                return () => clearTimeout(transitionTimer);
            }
          }, 700);
          return () => clearTimeout(flyThroughTimer);
        }
        if (gamePhase === 'lost') {
            const timer = setTimeout(() => {
                if (!isMounted.current) return;
                setSelectedDoor(null);
                setDoorAnimationState(null);
            }, 800);
            return () => clearTimeout(timer);
        }
    }
    processGamePhase();
  }, [gamePhase, selectedDoor, level, betAmount, riskLevel, calculateTotalMultiplier, createDoorsForLevel, adjustBalance, playSound]);

  const handlePlayAgain = () => {
    playSound('click');
    setGamePhase('config');
    setLevel(0);
    setWinnings(0);
    setSelectedDoor(null);
    setDoorAnimationState(null);
  };
  
  const handleRiskChange = (direction: 'next' | 'prev') => {
    const currentIndex = RISK_ORDER.indexOf(riskLevel);
    const nextIndex = (direction === 'next') 
      ? (currentIndex + 1) % RISK_ORDER.length 
      : (currentIndex - 1 + RISK_ORDER.length) % RISK_ORDER.length;
    setRiskLevel(RISK_ORDER[nextIndex]);
  };

  const cameraStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (gamePhase.startsWith('reveal') && selectedDoor) {
      const x = -selectedDoor.offset;
      let z = 600;
      let opacity = 1;
      let scale = 1;
      let rotate = 0;
      let transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)';

      if (gamePhase === 'reveal_fly_through') {
        z = 1800; 
        opacity = 0;
        scale = 2.2;
        rotate = 8;
        transition = 'transform 0.7s cubic-bezier(0.32, 0, 0.67, 0), opacity 0.6s ease-out';
      }
      
      style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale}) rotateZ(${rotate}deg)`;
      style.opacity = opacity;
      style.transition = transition;
    } else {
      style.transform = 'translateX(0px) translateZ(0px) scale(1) rotateZ(0deg)';
      style.opacity = 1;
      style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease';
    }
    return style;
  }, [gamePhase, selectedDoor]);
    
  const nextTotalMultiplier = useMemo(() => {
    return calculateTotalMultiplier(level + 1);
  }, [calculateTotalMultiplier, level]);
  
  const isConfigPhase = gamePhase === 'config';
  const isGameActive = gamePhase === 'playing';
  const isRevealing = gamePhase.startsWith('reveal');
  const isFinished = gamePhase === 'lost' || gamePhase === 'cashed_out';

  const actionButton = useMemo(() => {
    if (!isConfigPhase && !isFinished) {
      return <button onClick={handleCashout} disabled={level === 0 || gamePhase !== 'playing'} className="w-full h-full text-2xl font-bold rounded-md transition-all uppercase text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed">Cashout <br /><span className="text-xl">{winnings.toFixed(2)} EUR</span></button>;
    }
    if (isFinished) {
      return <button onClick={handlePlayAgain} className="w-full h-full text-2xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase">Bet Again</button>;
    }
    return <button onClick={handleBet} disabled={!profile || betAmount > profile.balance} className="w-full h-full text-2xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">Bet</button>;
  }, [gamePhase, winnings, level, profile, betAmount, handlePlayAgain, handleCashout, handleBet, isConfigPhase, isFinished]);
  
  return (
    <div className="h-screen w-screen flex flex-col font-poppins text-white select-none overflow-hidden bg-gradient-to-br from-[#1a1d3a] via-[#1e152f] to-[#0f1124]">
        {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
        <header className="relative z-30 flex items-center justify-between p-3 bg-black/20 backdrop-blur-sm shrink-0">
            <div className="flex-1 flex items-center gap-4">
                <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-black/20"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="text-red-500 text-2xl font-bold uppercase">Doors</h1>
            </div>
            <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5"><span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span><span className="text-sm text-gray-400 ml-2">EUR</span></div>
            <div className="flex-1 flex justify-end items-center space-x-4"><button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button><button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button></div>
        </header>
        
        <div className={`doors-camera-container ${gamePhase === 'reveal_action' && selectedDoor?.door.type === 'locked' ? 'animate-screen-shake-subtle' : ''}`}>
            <div className="h-28 flex items-center justify-center">
                {(!isConfigPhase && !isFinished) && (
                    <div className="doors-multiplier-panel">
                        <p className="text-xl font-bold text-yellow-400/80 -mb-2">Next Multiplier</p>
                        <p key={level} className="text-8xl sm:text-9xl doors-multiplier-text animate-pulse-once">
                            {nextTotalMultiplier.toFixed(2)}x
                        </p>
                    </div>
                )}
            </div>
            
            <div className='doors-camera' style={cameraStyle}>
              <div className="w-full doors-scroll-wrapper">
                <div ref={gridRef} className={`doors-grid min-h-[190px] md:min-h-[220px] w-max mx-auto transition-opacity duration-300 ${gamePhase !== 'transitioning' ? 'opacity-100' : 'opacity-0'}`}>
                    {doors.map((door, index) => (
                        <DoorComponent
                            ref={el => { if(el) doorRefs.current[index] = el }}
                            key={door.id}
                            isSafe={door.type === 'safe'}
                            onClick={() => handleDoorClick(door, index)}
                            isClickable={isGameActive}
                            isRevealed={isFinished} // Show all doors at the end
                            animationState={selectedDoor?.door.id === door.id ? doorAnimationState : null}
                            isFaded={isRevealing && selectedDoor?.door.id !== door.id}
                        />
                    ))}
                </div>
              </div>
            </div>
        </div>
        
        <footer className="relative z-30 w-full bg-[#1a1b2f] p-4 border-t border-gray-700/50 shrink-0">
            <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-stretch justify-center gap-4 md:gap-8">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet</label>
                        <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                            <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><MinusIcon className="w-5 h-5"/></button>
                            <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isConfigPhase} className="w-24 bg-transparent text-center font-bold text-lg outline-none disabled:cursor-not-allowed" />
                            <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                            <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1 block">Game Risk</label>
                        <div className="flex items-center justify-between bg-[#2f324d] rounded-md p-1 w-48">
                            <button onClick={() => handleRiskChange('prev')} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronLeftIcon className="w-4 h-4"/></button>
                            <span className={`font-bold text-base ${RISK_LEVELS_UI[riskLevel].color}`}>{riskLevel}</span>
                            <button onClick={() => handleRiskChange('next')} disabled={!isConfigPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronRightIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>
                <div className="flex-grow max-w-xs w-full md:w-auto h-14 md:h-auto">{actionButton}</div>
            </div>
        </footer>

        <GameRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
};

export default DoorsGame;