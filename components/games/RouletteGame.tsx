import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import UndoIcon from '../icons/UndoIcon';
import RebetIcon from '../icons/RebetIcon';
import ClearIcon from '../icons/ClearIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useUser } from '../../contexts/UserContext';
import RouletteRulesModal from './roulette/RouletteRulesModal';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const MAX_PROFIT = 10000.00;

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
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColorClass = (num: number) => {
    if (num === 0) return 'bg-green-600';
    if (RED_NUMBERS.includes(num)) return 'bg-red-600';
    return 'bg-black';
};

const getNumberColor = (num: number) => {
    if (num === 0) return '#16a34a'; // Green
    if (RED_NUMBERS.includes(num)) return '#dc2626'; // Red
    return '#171717'; // Black
};

type GamePhase = 'betting' | 'spinning' | 'result';
type Bet = { [betArea: string]: number[] };
type BetAction = {
  type: 'add' | 'clear' | 'rebet';
  bets: Bet;
};


interface RouletteGameProps {
  onBack: () => void;
}

const RouletteGame: React.FC<RouletteGameProps> = ({ onBack }) => {
  const { profile, adjustBalance } = useUser();
  const [bets, setBets] = useState<Bet>({});
  const [betHistory, setBetHistory] = useState<BetAction[]>([]);
  const [lastBets, setLastBets] = useState<Bet | null>(null);
  const [selectedChip, setSelectedChip] = useState(CHIP_VALUES[0]);
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [spinId, setSpinId] = useState(0);

  const [animationStyles, setAnimationStyles] = useState<{
    wheel: React.CSSProperties;
    orbitingBallContainer: React.CSSProperties;
    settledBallWrapper: React.CSSProperties;
    settledBall: React.CSSProperties;
  }>({
    wheel: {},
    orbitingBallContainer: {},
    settledBallWrapper: {},
    settledBall: {},
  });


  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const totalBet = useMemo(() => Object.values(bets).flat().reduce((sum, amount) => sum + amount, 0), [bets]);

  const handlePlaceBet = (betAreaKey: string) => {
    if (gamePhase !== 'betting' || !profile) return;
    if (profile.balance < totalBet + selectedChip) {
      console.log("Not enough balance for this bet.");
      return;
    }

    const newBets = { ...bets };
    const currentChips = newBets[betAreaKey] || [];
    newBets[betAreaKey] = [...currentChips, selectedChip];
    const betPlacement: BetAction = { type: 'add', bets: newBets };
    setBets(newBets);
    setBetHistory(prev => [...prev, betPlacement]);
  };

  const handleUndo = useCallback(() => {
    if (gamePhase !== 'betting' || betHistory.length === 0) return;
    
    const newHistory = [...betHistory];
    newHistory.pop();
    setBetHistory(newHistory);

    const previousBets = newHistory.length > 0 ? newHistory[newHistory.length - 1].bets : {};
    setBets(previousBets);
}, [betHistory, gamePhase]);

  const handleClear = () => {
    if (gamePhase !== 'betting' || totalBet === 0) return;
    setBets({});
    const betPlacement: BetAction = { type: 'clear', bets: {} };
    setBetHistory(prev => [...prev, betPlacement]);
  };

  const handleRebet = () => {
    if (gamePhase !== 'betting' || !lastBets || !profile) return;
    const rebetAmount = Object.values(lastBets).flat().reduce((sum, amount) => sum + amount, 0);
    if (profile.balance >= rebetAmount) {
      setBets(lastBets);
      const betPlacement: BetAction = { type: 'rebet', bets: lastBets };
      setBetHistory([betPlacement]);
    } else {
      console.log("Not enough balance to rebet.");
    }
  };

  const handleSpin = async () => {
    if (totalBet === 0 || gamePhase !== 'betting') return;
    
    setSpinId(id => id + 1);
    setLastBets(bets);
    await adjustBalance(-totalBet);
    if (!isMounted.current) return;

    const spinResult = Math.floor(Math.random() * 37);
    setWinningNumber(spinResult);
    setGamePhase('spinning');

    const winningNumberIndex = WHEEL_NUMBERS.indexOf(spinResult);
    const anglePerPocket = 360 / 37;
    const winningPocketAngle = winningNumberIndex * anglePerPocket;

    const totalDuration = 8;
    const handoffTime = 7;
    const settleDuration = totalDuration - handoffTime;

    const finalWheelAngle = (7 * 360) - winningPocketAngle;
    const orbitingBallAngle = -(12 * 360);

    setAnimationStyles({
      wheel: {
        '--wheel-final-angle': `${finalWheelAngle}deg`,
        animation: `roulette-wheel-spin-final ${totalDuration}s cubic-bezier(0.23, 1, 0.32, 1) forwards`,
      } as React.CSSProperties,
      orbitingBallContainer: {
        '--ball-orbit-angle': `${orbitingBallAngle}deg`,
        animation: `roulette-ball-orbit-and-fade ${handoffTime}s cubic-bezier(0.15, 0.7, 0.5, 1) forwards`,
      } as React.CSSProperties,
      settledBallWrapper: {
        transform: `rotate(${winningPocketAngle}deg)`,
      },
      settledBall: {
        animation: `roulette-ball-settle-in-pocket ${settleDuration}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${handoffTime}s`,
      },
    });

    setTimeout(async () => {
      if (!isMounted.current) return;
      setGamePhase('result');
      
      const PAYOUT_TABLE = { 'num': 36, 'split': 18, 'street': 12, 'corner': 9, 'line': 6, 'dozen': 3, 'col': 3, 'even_money': 2 };
      const betTypes = {
          'dozen-1': { numbers: Array.from({length: 12}, (_, i) => i + 1), payout: PAYOUT_TABLE.dozen },
          'dozen-2': { numbers: Array.from({length: 12}, (_, i) => i + 13), payout: PAYOUT_TABLE.dozen },
          'dozen-3': { numbers: Array.from({length: 12}, (_, i) => i + 25), payout: PAYOUT_TABLE.dozen },
          'col-1': { numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], payout: PAYOUT_TABLE.col },
          'col-2': { numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], payout: PAYOUT_TABLE.col },
          'col-3': { numbers: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34], payout: PAYOUT_TABLE.col },
          'low': { numbers: Array.from({length: 18}, (_, i) => i + 1), payout: PAYOUT_TABLE.even_money },
          'even': { numbers: Array.from({length: 18}, (_, i) => (i + 1) * 2).filter(n => n !== 0), payout: PAYOUT_TABLE.even_money },
          'red': { numbers: RED_NUMBERS, payout: PAYOUT_TABLE.even_money },
          'black': { numbers: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35], payout: PAYOUT_TABLE.even_money },
          'odd': { numbers: Array.from({length: 18}, (_, i) => i * 2 + 1), payout: PAYOUT_TABLE.even_money },
          'high': { numbers: Array.from({length: 18}, (_, i) => i + 19), payout: PAYOUT_TABLE.even_money },
      };

      let payout = 0;
      for (const betArea in bets) {
        const betAmount = bets[betArea].reduce((sum, chip) => sum + chip, 0);
        if (betArea.startsWith('num-')) {
            const num = parseInt(betArea.split('-')[1]);
            if (num === spinResult) payout += betAmount * PAYOUT_TABLE.num;
        } else if (betTypes[betArea] && betTypes[betArea].numbers.includes(spinResult)) {
            payout += betAmount * betTypes[betArea].payout;
        }
      }
      
      if (payout > 0) {
        await adjustBalance(payout);
      }
      
      setTimeout(() => {
        if (!isMounted.current) return;
        setGamePhase('betting');
        setBets({});
        setBetHistory([]);
        setAnimationStyles(prev => ({
          ...prev,
          wheel: {},
          orbitingBallContainer: { opacity: 0 }
        }));
      }, 3000);
    }, (totalDuration + 0.5) * 1000);
  };
  
  const renderBetArea = (key: string, text: string | number, className: string, gridPosition: string) => {
    const chipsOnArea = bets[key];
    return (
        <div onClick={() => handlePlaceBet(key)} className={`bet-area ${className} ${gridPosition}`}>
            {!chipsOnArea && text}
            {chipsOnArea && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-3/4 h-3/4">
                        {chipsOnArea.slice(-5).map((chipValue, index) => {
                            const chipData = CHIP_DATA.find(c => c.value === chipValue);
                            if (!chipData) return null;
                            return (
                                <img
                                    key={index}
                                    src={chipData.imageUrl}
                                    alt={`${chipValue} chip`}
                                    className="absolute top-0 left-0 w-full h-full object-contain drop-shadow-md"
                                    style={{
                                        transform: `translateY(${-index * 5}px)`,
                                        zIndex: index,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

  const showSettledBall = (gamePhase !== 'betting' || winningNumber !== null) && winningNumber !== null;

  return (
    <div className="bg-[#1a202c] min-h-screen flex flex-col font-poppins text-white select-none">
      <header className="flex items-center justify-between px-4 py-2 bg-[#2d3748]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold text-red-500 uppercase">Roulette</h1>
          <div className="text-xs text-gray-400 font-semibold hidden md:flex gap-4">
            <span>Min Bet: {MIN_BET.toFixed(2)} EUR</span>
            <span>Max Bet: {MAX_BET.toFixed(2)} EUR</span>
            <span>Max Profit: {MAX_PROFIT.toFixed(2)} EUR</span>
          </div>
        </div>
        <div className="flex items-center bg-black/30 rounded-md px-4 py-1.5">
          <span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span>
          <span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <span className="font-mono text-gray-400">{timer}</span>
          <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsRulesModalOpen(true)} className="text-gray-400 hover:text-white flex items-center gap-1"><GameRulesIcon className="w-5 h-5" /> Game Rules</button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 gap-8">
        <div className="roulette-visual-container">
            <div className="roulette-outer-track"></div>
            <div id="wheel" key={`wheel-${spinId}`} className="roulette-wheel" style={animationStyles.wheel}>
                {WHEEL_NUMBERS.map((num, i) => {
                    const angle = i * (360 / 37);
                    return (
                        <div key={`num-${i}`} className="pocket" style={{ transform: `rotate(${angle}deg)` }}>
                            <div className="pocket-inner" style={{ backgroundColor: getNumberColor(num) }}>
                                <span className="pocket-number">{num}</span>
                            </div>
                        </div>
                    );
                })}
                {showSettledBall && (
                    <div className="settled-ball-wrapper" style={animationStyles.settledBallWrapper}>
                        <div className="ball" style={animationStyles.settledBall}></div>
                    </div>
                )}
            </div>
          
            <div className="roulette-center-hub">
                <div className="hub-inner-1">
                    <div className="hub-inner-2">
                         <span className="text-gray-300 text-sm font-bold tracking-wider">EUROPEAN</span>
                         <span className="text-white text-lg font-black -mt-1">ROULETTE</span>
                    </div>
                </div>
            </div>
            
            {gamePhase === 'spinning' && (
              <div id="ball-container" key={`orbit-${spinId}`} className="ball-orbit-container" style={animationStyles.orbitingBallContainer}>
                  <div className="ball-path">
                      <div id="ball" className="ball"></div>
                  </div>
              </div>
            )}
          
            {gamePhase === 'result' && (
              <div className="absolute inset-0 flex items-center justify-center animate-pulse z-20 pointer-events-none">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl ${getNumberColorClass(winningNumber ?? 0)}`}>
                      {winningNumber}
                  </div>
              </div>
            )}
        </div>
        
        <div className="w-[700px] p-2 bg-[#2d3748] rounded-lg">
            <div className="grid grid-cols-[auto_repeat(12,1fr)_auto] grid-rows-5 gap-1">
                {renderBetArea('num-0', 0, 'bg-green-700 hover:bg-green-600 rounded-l-md', 'row-span-3 col-start-1')}

                {Array.from({ length: 12 }, (_, i) => i * 3 + 3).map((num, i) => renderBetArea(`num-${num}`, num, getNumberColorClass(num), `col-start-${i + 2}`))}
                {renderBetArea('col-1', '2:1', 'bg-gray-600 hover:bg-gray-500 rounded-tr-md', 'row-start-1 col-start-14')}
                
                {Array.from({ length: 12 }, (_, i) => i * 3 + 2).map((num, i) => renderBetArea(`num-${num}`, num, getNumberColorClass(num), `col-start-${i + 2}`))}
                {renderBetArea('col-2', '2:1', 'bg-gray-600 hover:bg-gray-500', 'row-start-2 col-start-14')}

                {Array.from({ length: 12 }, (_, i) => i * 3 + 1).map((num, i) => renderBetArea(`num-${num}`, num, getNumberColorClass(num), `col-start-${i + 2}`))}
                {renderBetArea('col-3', '2:1', 'bg-gray-600 hover:bg-gray-500 rounded-br-md', 'row-start-3 col-start-14')}

                {renderBetArea('dozen-1', '1st 12', 'bg-gray-600 hover:bg-gray-500', 'col-start-2 col-span-4')}
                {renderBetArea('dozen-2', '2nd 12', 'bg-gray-600 hover:bg-gray-500', 'col-start-6 col-span-4')}
                {renderBetArea('dozen-3', '3rd 12', 'bg-gray-600 hover:bg-gray-500', 'col-start-10 col-span-4')}
                
                {renderBetArea('low', '1-18', 'bg-gray-600 hover:bg-gray-500', 'col-start-2 col-span-2')}
                {renderBetArea('even', 'Even', 'bg-gray-600 hover:bg-gray-500', 'col-start-4 col-span-2')}
                {renderBetArea('red', '', `${getNumberColorClass(1)} hover:bg-red-500`, 'col-start-6 col-span-2')}
                {renderBetArea('black', '', `${getNumberColorClass(2)} hover:bg-gray-800`, 'col-start-8 col-span-2')}
                {renderBetArea('odd', 'Odd', 'bg-gray-600 hover:bg-gray-500', 'col-start-10 col-span-2')}
                {renderBetArea('high', '19-36', 'bg-gray-600 hover:bg-gray-500', 'col-start-12 col-span-2')}
            </div>
        </div>
      </main>
      
      <footer className="shrink-0 bg-[#2d3748] p-3">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleUndo} disabled={gamePhase !== 'betting' || betHistory.length === 0} className="control-button"><UndoIcon className="w-5 h-5"/></button>
            <button onClick={handleRebet} disabled={gamePhase !== 'betting' || !lastBets} className="control-button"><RebetIcon className="w-5 h-5"/></button>
            <button onClick={handleClear} disabled={gamePhase !== 'betting' || totalBet === 0} className="control-button"><ClearIcon className="w-5 h-5"/></button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button disabled className="p-2 hidden sm:block"><ChevronLeftIcon className="w-5 h-5 text-gray-500"/></button>
            {CHIP_DATA.map(chip => (
                <button 
                    key={chip.value} 
                    onClick={() => setSelectedChip(chip.value)} 
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full focus:outline-none transition-all duration-200 ease-in-out ${selectedChip === chip.value ? 'scale-110 -translate-y-2' : 'scale-90 opacity-80 hover:opacity-100 hover:scale-95'}`}
                    aria-label={`Select ${chip.value} EUR chip`}
                >
                    <img src={chip.imageUrl} alt={`${chip.value} EUR chip`} className="w-full h-full object-contain" />
                    {selectedChip === chip.value && <div className="absolute inset-0 rounded-full ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#2d3748]"></div>}
                </button>
            ))}
            <button disabled className="p-2 hidden sm:block"><ChevronRightIcon className="w-5 h-5 text-gray-500"/></button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-xs text-gray-400">Total Bet</span>
              <p className="font-bold">{totalBet.toFixed(2)} EUR</p>
            </div>
            <button onClick={handleSpin} disabled={gamePhase !== 'betting' || totalBet === 0} className="px-12 sm:px-16 py-4 text-xl font-bold rounded-md bg-green-600 hover:bg-green-700 transition-colors text-white uppercase disabled:bg-gray-500 disabled:cursor-not-allowed">
              Bet
            </button>
          </div>
        </div>
      </footer>
       <style>{`
        .bet-area {
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s;
          position: relative;
          overflow: visible;
        }
        .control-button {
          padding: 0.75rem;
          background-color: #4A5568;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }
        .control-button:hover:not(:disabled) {
          background-color: #718096;
        }
        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        /* New Roulette Wheel Styles */
        .roulette-visual-container {
            position: relative;
            width: 450px;
            height: 450px;
            background: #1a202c;
            border-radius: 50%;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .roulette-outer-track {
            position: absolute;
            width: 100%;
            height: 100%;
            background: #6b462a;
            border-radius: 50%;
            box-shadow: inset 0 0 25px rgba(0,0,0,0.7);
        }
        .roulette-wheel {
            position: absolute;
            inset: 20px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.1);
            background: #2d3748;
        }
        .pocket {
            position: absolute;
            top: 0;
            left: 50%;
            width: 8.5%;
            height: 50%;
            transform-origin: bottom center;
            margin-left: -4.25%;
        }
        .pocket-inner {
            width: 100%;
            height: 100%;
            clip-path: polygon(20% 0, 80% 0, 100% 100%, 0% 100%);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 10px;
        }
        .pocket-number {
            font-size: 16px;
            font-weight: bold;
            color: white;
            transform: scale(0.8) rotate(180deg);
        }
        .roulette-center-hub {
            position: absolute;
            width: 180px;
            height: 180px;
            background: #4a5568;
            border-radius: 50%;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 5px solid #a0aec0;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }
        .hub-inner-1 {
            width: 150px;
            height: 150px;
            background: #2d3748;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #718096;
        }
        .hub-inner-2 {
            width: 120px;
            height: 120px;
            background: #1a202c;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid #4a5568;
        }
        .ball-orbit-container {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 5;
            pointer-events: none;
        }
        .ball-path {
            position: absolute;
            top: 10%;
            left: 50%;
            width: 16px;
            height: 80%;
            margin-left: -8px;
        }
        .ball {
            width: 16px;
            height: 16px;
            background: #e2e8f0;
            border-radius: 50%;
            box-shadow: inset 2px -2px 4px rgba(0,0,0,0.4);
        }
        .settled-ball-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 6;
            pointer-events: none;
        }
        .settled-ball-wrapper .ball {
            position: absolute;
            top: 0;
            left: 50%;
            opacity: 0; 
            transform-origin: center center;
            margin-left: -8px; /* half of ball width */
        }
       `}</style>
       <RouletteRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
};

export default RouletteGame;