

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '../../contexts/UserContext';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';

const MIN_BET = 0.20;
const MAX_BET = 1000.00;
const PRE_ROUND_WAIT_TIME = 6000; // 6s
const BETTING_TIME = 5000; // 5s

type GamePhase = 'waiting' | 'betting' | 'running' | 'crashed';
type BetState = {
  amount: number;
  input: string;
  isPlaced: boolean;
  hasCollected: boolean;
  autoCollect: boolean;
  collectAt: number;
  collectInput: string;
};

const initialBetState = (amount: number, collectAt: number): BetState => ({
  amount,
  input: amount.toFixed(2),
  isPlaced: false,
  hasCollected: false,
  autoCollect: false,
  collectAt,
  collectInput: collectAt.toFixed(2),
});

const BetPanel: React.FC<{
    betState: BetState;
    onBetStateChange: (newState: Partial<BetState>) => void;
    onPlaceBet: () => void;
    onCollect: () => void;
    gamePhase: GamePhase;
    canBet: boolean;
    currentMultiplier: number;
}> = ({ betState, onBetStateChange, onPlaceBet, onCollect, gamePhase, canBet, currentMultiplier }) => {

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onBetStateChange({ input: e.target.value });
    };

    const handleAmountBlur = () => {
        let value = parseFloat(betState.input);
        if (isNaN(value) || value < MIN_BET) value = MIN_BET;
        if (value > MAX_BET) value = MAX_BET;
        onBetStateChange({ amount: value, input: value.toFixed(2) });
    };
    
    const handleCollectAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onBetStateChange({ collectInput: e.target.value });
    };

    const handleCollectAtBlur = () => {
        let value = parseFloat(betState.collectInput);
        if (isNaN(value) || value < 1.01) value = 1.01;
        onBetStateChange({ collectAt: value, collectInput: value.toFixed(2) });
    };

    const isBettingPhase = gamePhase === 'betting' || gamePhase === 'waiting';
    const isRunningWithBet = gamePhase === 'running' && betState.isPlaced && !betState.hasCollected;
    const isNextRoundBet = betState.isPlaced && isBettingPhase;

    const actionButton = () => {
        if (isRunningWithBet) {
            return <button onClick={onCollect} className="w-full h-full text-xl font-bold rounded-md bg-yellow-500 hover:bg-yellow-600 transition-colors text-black uppercase">Collect {currentMultiplier.toFixed(2)}x</button>;
        }
        return <button onClick={onPlaceBet} disabled={!canBet && !betState.isPlaced} className={`w-full h-full text-xl font-bold rounded-md transition-colors text-black uppercase ${isNextRoundBet ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#9dff00] hover:bg-[#8ee000]'} disabled:bg-gray-500 disabled:cursor-not-allowed`}>{isNextRoundBet ? 'Cancel' : 'Bet'}</button>;
    };

    return (
        <div className="bg-[#21243e] p-3 rounded-md flex-1">
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={() => onBetStateChange({ amount: Math.max(MIN_BET, betState.amount / 2)})} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded"><MinusIcon className="w-4 h-4"/></button>
                        <input type="text" value={betState.input} onChange={handleAmountChange} onBlur={handleAmountBlur} disabled={!isBettingPhase} className="flex-grow w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <button onClick={() => onBetStateChange({ amount: Math.min(MAX_BET, betState.amount * 2)})} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                <div className="col-span-1">
                     <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <input type="text" value={betState.collectInput} onChange={handleCollectAtChange} onBlur={handleCollectAtBlur} disabled={!isBettingPhase} className="flex-grow w-full bg-transparent text-center font-bold text-base outline-none disabled:cursor-not-allowed" />
                        <div className="flex flex-col"><button onClick={() => onBetStateChange({ collectAt: betState.collectAt + 1 })} disabled={!isBettingPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronUpIcon className="w-3 h-3" /></button><button onClick={() => onBetStateChange({ collectAt: Math.max(1.01, betState.collectAt - 1) })} disabled={!isBettingPhase} className="px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"><ChevronDownIcon className="w-3 h-3" /></button></div>
                    </div>
                </div>
            </div>
            <div className="h-24 mt-3">
                {actionButton()}
            </div>
        </div>
    );
};

const DinoGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { profile, adjustBalance } = useUser();
    const [phase, setPhase] = useState<GamePhase>('waiting');
    const [countdown, setCountdown] = useState(0);
    const [multiplier, setMultiplier] = useState(1.00);
    const [crashPoint, setCrashPoint] = useState(0);
    const [history, setHistory] = useState<number[]>([]);
    
    const [bet1, setBet1] = useState(() => initialBetState(5.00, 5.00));
    const [bet2, setBet2] = useState(() => initialBetState(5.00, 5.00));

    const bet1Ref = useRef(bet1);
    bet1Ref.current = bet1;
    const bet2Ref = useRef(bet2);
    bet2Ref.current = bet2;

    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
    const gameLoopRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleCollect = useCallback(async (panel: 1 | 2, collectMultiplier: number) => {
        const betState = panel === 1 ? bet1Ref.current : bet2Ref.current;
        const stateUpdater = panel === 1 ? setBet1 : setBet2;

        if (betState.isPlaced && !betState.hasCollected) {
            // Update state first to prevent multiple calls
            stateUpdater(b => ({ ...b, hasCollected: true }));
            const winnings = betState.amount * collectMultiplier;
            await adjustBalance(winnings);
        }
    }, [adjustBalance]);

    useEffect(() => {
        if (!isMounted.current) return;

        if (phase === 'waiting') {
            setMultiplier(1.00);
            const timerId = setTimeout(() => {
                if (isMounted.current) setPhase('betting');
            }, PRE_ROUND_WAIT_TIME - BETTING_TIME);
            return () => clearTimeout(timerId);
        }

        if (phase === 'betting') {
            setCountdown(BETTING_TIME / 1000);
            const countdownInterval = setInterval(() => {
                setCountdown(c => {
                    if (c <= 1) {
                        clearInterval(countdownInterval);
                        if (isMounted.current) setPhase('running');
                        return 0;
                    }
                    return c - 1;
                });
            }, 1000);
            return () => clearInterval(countdownInterval);
        }

        if (phase === 'running') {
            const crash = 1 + Math.pow(Math.random(), 4) * 100; // Skewed towards lower numbers
            setCrashPoint(crash);
            startTimeRef.current = performance.now();
            const animate = (time: number) => {
                if (!isMounted.current) return;
                const elapsed = time - startTimeRef.current!;
                const currentMultiplier = 1.00 * Math.pow(1.0006, elapsed);

                if (currentMultiplier >= crash) {
                    setMultiplier(crash);
                    setHistory(h => [crash, ...h].slice(0, 20));
                    if (isMounted.current) setPhase('crashed');
                    return;
                }

                setMultiplier(currentMultiplier);
                
                const currentBet1 = bet1Ref.current;
                const currentBet2 = bet2Ref.current;
                
                // Auto-collect logic
                if (currentBet1.isPlaced && !currentBet1.hasCollected && currentBet1.autoCollect && currentMultiplier >= currentBet1.collectAt) {
                    handleCollect(1, currentBet1.collectAt);
                }
                if (currentBet2.isPlaced && !currentBet2.hasCollected && currentBet2.autoCollect && currentMultiplier >= currentBet2.collectAt) {
                    handleCollect(2, currentBet2.collectAt);
                }

                gameLoopRef.current = requestAnimationFrame(animate);
            };
            gameLoopRef.current = requestAnimationFrame(animate);
            
            return () => {
                if (gameLoopRef.current) window.cancelAnimationFrame(gameLoopRef.current);
            };
        }

        if (phase === 'crashed') {
            setBet1(s => ({...s, isPlaced: false, hasCollected: false}));
            setBet2(s => ({...s, isPlaced: false, hasCollected: false}));
            const timerId = setTimeout(() => {
                if (isMounted.current) setPhase('waiting');
            }, 3000);
            return () => clearTimeout(timerId);
        }
    }, [phase, handleCollect]);
    
    const handlePlaceBet = async (panel: 1 | 2) => {
        const stateUpdater = panel === 1 ? setBet1 : setBet2;
        const betState = panel === 1 ? bet1 : bet2;

        if (betState.isPlaced) { // Cancel bet
            stateUpdater(s => ({...s, isPlaced: false}));
            await adjustBalance(betState.amount);
        } else { // Place bet
            if (profile && profile.balance >= betState.amount) {
                await adjustBalance(-betState.amount);
                stateUpdater(s => ({...s, isPlaced: true}));
            }
        }
    };
    
    const getHistoryColor = (val: number) => {
        if (val < 2) return 'text-red-500';
        if (val < 10) return 'text-green-400';
        return 'text-purple-400';
    };

    return (
    <div className="bg-[#0f1124] h-screen flex flex-col font-poppins text-white select-none">
      <header className="flex items-center justify-between p-3 bg-[#1a1b2f] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to games"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold uppercase text-green-400">Dino</h1>
        </div>
        <div className="flex items-center bg-black/30 rounded-md px-4 py-1.5">
          <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
          <span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <span className="font-mono text-gray-400">{phase === 'betting' ? `Starting in ${countdown}s` : '00:00:00'}</span>
          <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button>
          <button className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
        </div>
      </header>
      
      <main className="flex-grow bg-[#141829] flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(https://i.imgur.com/pt2UK8u.png)', animation: phase === 'running' ? 'sky-scroll 80s linear infinite' : 'none' }}></div>
        <div className="absolute inset-0 bg-no-repeat bg-bottom" style={{ backgroundImage: 'url(https://i.imgur.com/JflbS8T.png)', backgroundSize: '2000px auto', animation: phase === 'running' ? 'ground-scroll 10s linear infinite' : 'none' }}></div>
        
        <div className="flex-grow flex items-center justify-center">
            {phase === 'betting' && <div className="text-4xl font-bold text-white/50 z-10">Starting in {countdown}s...</div>}
            {(phase === 'running' || phase === 'crashed') &&
                <div className="text-center z-10">
                    <p className={`font-bebas text-8xl font-bold drop-shadow-lg ${phase === 'crashed' ? 'text-red-500' : 'text-white'}`}>{multiplier.toFixed(2)}x</p>
                </div>
            }
        </div>

        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 z-10">
            {phase === 'crashed' ? (
                <>
                    <img src="https://i.imgur.com/tC6F24B.png" alt="Dino Hit" className="w-full h-full" />
                    <div className="absolute inset-0 flex items-center justify-center text-yellow-300 text-4xl animate-ping" style={{animation: 'crash-dizzy 0.5s ease-out forwards'}}>&#10022;</div>
                </>
            ) : (
                <img src="https://i.imgur.com/5iA4L5g.png" alt="Dino" className={`w-full h-full ${phase === 'running' ? 'animate-[dino-run-bob_0.5s_ease-in-out_infinite]' : ''}`} />
            )}
        </div>
        
        {phase === 'crashed' && (
            <div className="absolute top-0 right-1/2 w-48 h-48 z-20" style={{ animation: 'meteor-fall 0.6s ease-in forwards'}}>
                <img src="https://i.imgur.com/sB33V8N.png" alt="Meteor" />
            </div>
        )}

      </main>

      <footer className="shrink-0 bg-[#1a1b2f] p-4 border-t border-gray-700/50">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-3">
            <div className="bg-black/20 p-1 rounded-md flex items-center gap-2 overflow-hidden">
                <div className="flex-shrink-0 text-gray-400 p-2"><ChevronUpIcon className="w-4 h-4" /></div>
                <div className="flex-grow flex items-center gap-3">
                    {history.map((val, i) => (
                        <span key={i} className={`px-2 py-1 rounded text-sm font-bold ${getHistoryColor(val)}`}>{val.toFixed(2)}</span>
                    ))}
                </div>
            </div>
            <div className="flex gap-4">
                <BetPanel betState={bet1} onBetStateChange={(s) => setBet1(b => ({ ...b, ...s }))} onPlaceBet={() => handlePlaceBet(1)} onCollect={() => handleCollect(1, multiplier)} gamePhase={phase} canBet={!!profile && profile.balance >= bet1.amount} currentMultiplier={multiplier} />
                <BetPanel betState={bet2} onBetStateChange={(s) => setBet2(b => ({ ...b, ...s }))} onPlaceBet={() => handlePlaceBet(2)} onCollect={() => handleCollect(2, multiplier)} gamePhase={phase} canBet={!!profile && profile.balance >= bet2.amount} currentMultiplier={multiplier} />
            </div>
        </div>
      </footer>
    </div>
  );
};

export default DinoGame;