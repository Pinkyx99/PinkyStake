


import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SoundOnIcon from '../icons/SoundOnIcon';
import GameRulesIcon from '../icons/GameRulesIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import HitIcon from '../icons/HitIcon';
import StandIcon from '../icons/StandIcon';
import SplitIcon from '../icons/SplitIcon';
import DoubleIcon from '../icons/DoubleIcon';
import CardComponent from './blackjack/Card';
import { createDeck, shuffleDeck, getHandValue, type Card as CardType, getCardValue } from './blackjack/deck';
import { useUser } from '../../contexts/UserContext';
import { useSound } from '../../hooks/useSound';
import WinAnimation from '../WinAnimation';

interface BlackjackGameProps {
  onBack: () => void;
}

const MIN_BET = 0.20;
const MAX_BET = 1000.00;

type GamePhase = 'betting' | 'player_turn' | 'dealer_turn' | 'finished';
type HandStatus = 'playing' | 'stood' | 'bust' | 'blackjack';

interface Hand {
  cards: CardType[];
  bet: number;
  status: HandStatus;
}

const BlackjackGame: React.FC<BlackjackGameProps> = ({ onBack }) => {
  const { profile, adjustBalance } = useUser();
  const [betAmount, setBetAmount] = useState(1.00);
  const [betInput, setBetInput] = useState(betAmount.toFixed(2));
  const [gameState, setGameState] = useState<GamePhase>('betting');
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHands, setPlayerHands] = useState<Hand[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [winData, setWinData] = useState<{ amount: number; key: number } | null>(null);
  const payoutProcessed = useRef(false);
  const isMounted = useRef(true);
  const { playSound } = useSound();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const isGameInProgress = gameState === 'player_turn' || gameState === 'dealer_turn';
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
  }, [gameState]);

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

  const dealerScore = useMemo(() => getHandValue(dealerHand), [dealerHand]);
  const dealerVisibleScore = useMemo(() => {
    if (gameState === 'player_turn' && dealerHand.length > 0) {
      return getCardValue(dealerHand[0]);
    }
    return dealerScore;
  }, [dealerHand, gameState, dealerScore]);
  const showDealerScoreBadge = dealerHand.length > 0;

  useEffect(() => {
    if (gameState !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    // A hand is finished if its status is 'stood', 'bust', or 'blackjack'. If it's still 'playing', we wait.
    if (!currentHand || currentHand.status === 'playing') {
      return;
    }
    const nextHandTimer = setTimeout(() => {
        if (!isMounted.current) return;
        const nextIndex = activeHandIndex + 1;
        if (nextIndex < playerHands.length) {
            setActiveHandIndex(nextIndex);
        } else {
            setGameState('dealer_turn');
        }
    }, 500);
    return () => clearTimeout(nextHandTimer);
  }, [gameState, playerHands, activeHandIndex]);


  const handleBet = async () => {
    if (!profile || betAmount > profile.balance) return;
    payoutProcessed.current = false;
    playSound('bet');
    
    await adjustBalance(-betAmount);

    if (!isMounted.current) return;

    setActiveHandIndex(0);

    const newDeck = shuffleDeck(createDeck());
    
    // Deal cards with a slight delay for sound
    setTimeout(() => playSound('deal'), 100);
    const pCard1 = newDeck.pop();
    setTimeout(() => playSound('deal'), 300);
    const dCard1 = newDeck.pop();
    setTimeout(() => playSound('deal'), 500);
    const pCard2 = newDeck.pop();
    setTimeout(() => playSound('deal'), 700);
    const dCard2 = newDeck.pop();

    if (!pCard1 || !pCard2 || !dCard1 || !dCard2) {
      console.error("Could not deal initial cards, deck is too small.");
      if (isMounted.current) alert("A critical error occurred while starting the game. Refunding bet.");
      await adjustBalance(betAmount);
      return;
    }

    const pHandCards = [pCard1, pCard2];
    const dHandCards = [dCard1, dCard2];

    const newPlayerHand: Hand = { cards: pHandCards, bet: betAmount, status: 'playing' };
    
    setPlayerHands([newPlayerHand]);
    setDealerHand(dHandCards);
    setDeck(newDeck);
    
    const initialPlayerScore = getHandValue(pHandCards);
    if (initialPlayerScore === 21) {
      setPlayerHands([{ ...newPlayerHand, status: 'blackjack' }]);
      setGameState('dealer_turn');
    } else {
      setGameState('player_turn');
    }
  };

  const handleHit = () => {
    if (gameState !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand) return; // SAFETY CHECK

    playSound('deal');
    const newDeck = [...deck];
    const newCard = newDeck.pop();

    if (!newCard) {
      if (isMounted.current) alert("The deck has run out of cards. The hand will stand automatically.");
      handleStand();
      return;
    }

    const newHandCards = [...currentHand.cards, newCard];
    const newHands = [...playerHands];
    let updatedHand = { ...currentHand, cards: newHandCards };
    
    const newScore = getHandValue(newHandCards);
    if (newScore > 21) {
      playSound('lose');
      updatedHand.status = 'bust';
    } else if (newScore === 21) {
      updatedHand.status = 'stood';
    }
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);
    setDeck(newDeck);
  };

  const handleStand = () => {
    if (gameState !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand) return; // SAFETY CHECK

    playSound('click');
    const newHands = [...playerHands];
    newHands[activeHandIndex].status = 'stood';
    setPlayerHands(newHands);
  };

  const handleDouble = async () => {
    if (gameState !== 'player_turn' || !profile) return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand) return; // SAFETY CHECK

    if (currentHand.cards.length !== 2 || profile.balance < currentHand.bet) return;
    
    playSound('deal');
    await adjustBalance(-currentHand.bet);
    if (!isMounted.current) return;
    
    const newDeck = [...deck];
    const newCard = newDeck.pop();

    if (!newCard) {
      if (isMounted.current) alert("Not enough cards in deck to double down. Refunding double cost.");
      await adjustBalance(currentHand.bet);
      if (!isMounted.current) return;
      setDeck(newDeck);
      handleStand();
      return;
    }
    
    const newHandCards = [...currentHand.cards, newCard];
    const newHands = [...playerHands];
    
    let doubledHand = { ...currentHand, cards: newHandCards, bet: currentHand.bet * 2, status: 'stood' as HandStatus };
    if (getHandValue(newHandCards) > 21) {
        playSound('lose');
        doubledHand.status = 'bust';
    }
    newHands[activeHandIndex] = doubledHand;

    setPlayerHands(newHands);
    setDeck(newDeck);
  };

  const handleSplit = async () => {
    if (gameState !== 'player_turn' || !profile) return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand) return; // SAFETY CHECK
    
    if (currentHand.cards.length !== 2 || getCardValue(currentHand.cards[0]) !== getCardValue(currentHand.cards[1]) || profile.balance < currentHand.bet) return;
    
    playSound('deal');
    await adjustBalance(-currentHand.bet);
    if (!isMounted.current) return;

    const newDeck = [...deck];
    const cardForFirstHand = newDeck.pop();
    const cardForSecondHand = newDeck.pop();
    
    if (!cardForFirstHand || !cardForSecondHand) {
        if (isMounted.current) alert("Not enough cards in the deck to split. Refunding split cost.");
        await adjustBalance(currentHand.bet);
        if (isMounted.current) setDeck(newDeck);
        return;
    }
    
    const newHands: Hand[] = [...playerHands];
    const firstHand: Hand = { ...currentHand, cards: [currentHand.cards[0], cardForFirstHand], status: 'playing' };
    const secondHand: Hand = { ...currentHand, cards: [currentHand.cards[1], cardForSecondHand], status: 'playing' };
    
    if (getHandValue(firstHand.cards) === 21) firstHand.status = 'blackjack';
    if (getHandValue(secondHand.cards) === 21) secondHand.status = 'blackjack';

    newHands.splice(activeHandIndex, 1, firstHand, secondHand);
    setPlayerHands(newHands);
    setDeck(newDeck);
  };
  
  useEffect(() => {
    if (gameState !== 'dealer_turn') return;
    const dealerHandValue = getHandValue(dealerHand);
    if (dealerHandValue >= 17) {
      const timer = setTimeout(() => {
          if (isMounted.current) setGameState('finished');
      }, 500);
      return () => clearTimeout(timer);
    }
    const drawTimer = setTimeout(() => {
      if (!isMounted.current) return;
      playSound('deal');
      setDeck(currentDeck => {
        const newDeck = [...currentDeck];
        const cardToDraw = newDeck.pop();
        if (cardToDraw) {
          setDealerHand(currentHand => [...currentHand, cardToDraw]);
        } else {
          setGameState('finished');
        }
        return newDeck;
      });
    }, 800);
    return () => clearTimeout(drawTimer);
  }, [gameState, dealerHand, playSound]);

  const isFinished = gameState === 'finished';

  const { finalHandsWithResult, totalPayout } = useMemo(() => {
    if (!isFinished) {
      return { finalHandsWithResult: [], totalPayout: 0 };
    }

    const dScore = getHandValue(dealerHand);
    let totalPayoutCalc = 0;
    
    const handsWithResult = playerHands.map(hand => {
      let resultText = '';
      let handPayout = 0;
      let resultType: 'win' | 'loss' | 'push' = 'loss';
      
      switch (hand.status) {
        case 'bust':
          resultText = 'Bust!';
          resultType = 'loss';
          break;
        case 'blackjack':
          if (dScore === 21 && dealerHand.length === 2) {
            resultText = 'Push';
            handPayout = hand.bet;
            resultType = 'push';
          } else {
            resultText = 'Blackjack!';
            handPayout = hand.bet * 2.5;
            resultType = 'win';
          }
          break;
        case 'stood':
          const pScore = getHandValue(hand.cards);
          if (dScore > 21 || pScore > dScore) {
            resultText = 'Player Wins!';
            handPayout = hand.bet * 2;
            resultType = 'win';
          } else if (dScore > pScore) {
            resultText = 'Dealer Wins!';
            resultType = 'loss';
          } else {
            resultText = 'Push';
            handPayout = hand.bet;
            resultType = 'push';
          }
          break;
        default:
          resultText = 'Error';
          resultType = 'loss';
      }
      
      totalPayoutCalc += handPayout;
      return { ...hand, result: resultText, resultType };
    });

    return { finalHandsWithResult: handsWithResult, totalPayout: totalPayoutCalc };
  }, [isFinished, playerHands, dealerHand]);

  useEffect(() => {
    const processPayout = async () => {
        if (isFinished && !payoutProcessed.current) {
          payoutProcessed.current = true;
          if (totalPayout > 0) {
            const netWinnings = totalPayout - playerHands.reduce((acc, h) => acc + h.bet, 0);
            if (netWinnings > 0) {
                setWinData({ amount: netWinnings, key: Date.now() });
            }
            playSound('blackjack_win');
            await adjustBalance(totalPayout);
          } else if (playerHands.every(h => h.status === 'bust') || finalHandsWithResult.every(h => h.result === 'Dealer Wins!')) {
            // Only play lose sound if every hand lost and it wasn't a bust (already played).
            // A check here avoids double 'lose' sounds.
            if (!playerHands.some(h => h.status === 'bust')) {
                 playSound('lose');
            }
          }
        }
    };
    processPayout();
  }, [isFinished, totalPayout, adjustBalance, playSound, playerHands, finalHandsWithResult]);

  const renderHand = (handCards: CardType[], isPlayer: boolean, isActive: boolean = false) => {
    const handLength = handCards.length;
    const offset = window.innerWidth < 768 ? -32 : -56; // -2rem or -3.5rem
    return (
      <div className={'relative h-32 md:h-44 flex items-center justify-center p-2 rounded-xl transition-all duration-300'}>
        {handCards.map((card, index) => (
          <div
            key={index}
            className="transition-all duration-300 animate-deal-card"
            style={{
              transform: `rotate(${(index - (handLength - 1) / 2) * 8}deg)`,
              zIndex: index,
              marginLeft: index > 0 ? `${offset}px` : '0',
            }}
          >
            <CardComponent
              card={card}
              faceDown={!isPlayer && index === 1 && gameState === 'player_turn'}
            />
          </div>
        ))}
      </div>
    );
  };
  
  const renderScore = (score: number, show: boolean, forPlayerHand?: Hand) => {
    if (!show || score === 0) return null;
    let color = 'bg-gray-700';
    if (forPlayerHand) {
      if (forPlayerHand.status === 'blackjack' || getHandValue(forPlayerHand.cards) === 21) color = 'bg-yellow-500';
      else if (forPlayerHand.status === 'bust') color = 'bg-red-500';
      else if (forPlayerHand.status === 'stood') color = 'bg-blue-500';
      else color = 'bg-green-600';
    } else {
      if (isFinished && score > 21) color = 'bg-red-500';
      else if (isFinished && score === 21 && dealerHand.length === 2) color = 'bg-yellow-500';
      else color = 'bg-green-600';
    }
    return <span className={`absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-md ${color}`}>{score}</span>
  }
  
  const isBettingPhase = gameState === 'betting' || gameState === 'finished';

  const currentHand = useMemo(() => playerHands[activeHandIndex], [playerHands, activeHandIndex]);

  const isPlayerActionsDisabled = useMemo(() => {
      // Actions are disabled if it's not the player's turn, or if there's no hand, or the hand is not in a 'playing' state.
      if (gameState !== 'player_turn' || !currentHand || currentHand.status !== 'playing') {
          return true;
      }
      return false;
  }, [gameState, currentHand]);

  const canSplit = useMemo(() => {
      if (isPlayerActionsDisabled || !currentHand || !profile) return false;
      // Basic split condition
      return (
          currentHand.cards.length === 2 &&
          getCardValue(currentHand.cards[0]) === getCardValue(currentHand.cards[1]) &&
          profile.balance >= currentHand.bet
      );
  }, [currentHand, profile, isPlayerActionsDisabled]);

  const canDouble = useMemo(() => {
      if (isPlayerActionsDisabled || !currentHand || !profile) return false;
      // Basic double condition
      return currentHand.cards.length === 2 && profile.balance >= currentHand.bet;
  }, [currentHand, profile, isPlayerActionsDisabled]);
  
  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white select-none">
       {winData && <WinAnimation key={winData.key} amount={winData.amount} onComplete={() => setWinData(null)} />}
      <header className="flex items-center justify-between p-3 bg-[#1a1b2f] border-b border-gray-700/50">
        <div className="flex-1 flex items-center gap-4">
           <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-red-500 text-2xl font-bold uppercase">Blackjack</h1>
        </div>
        <div className="flex-1 flex justify-center items-center bg-black/30 rounded-md px-4 py-1.5">
          <span className="text-lg font-bold text-yellow-400">{animatedBalance.toFixed(2)}</span>
          <span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
        <div className="flex-1 flex items-center justify-end space-x-4">
          <span className="text-sm font-mono">{formatTime(timer)}</span>
          <button className="text-gray-400 hover:text-white"><SoundOnIcon className="w-5 h-5"/></button>
          <button className="text-gray-400 hover:text-white"><GameRulesIcon className="w-5 h-5"/></button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-around p-4">
        <div className="relative">
            {dealerHand.length > 0 && renderHand(dealerHand, false)}
            {renderScore(dealerVisibleScore, showDealerScoreBadge)}
        </div>

        <div className="text-center my-4 text-gray-400 text-sm space-y-1 min-h-[70px]">
            {!isFinished ? (
                <>
                    <p>Blackjack pays 3 to 2</p>
                    <p>Dealer Must stand on 17 and must draw to 16</p>
                </>
            ) : (
                <div className="flex gap-4 justify-center">
                    {finalHandsWithResult.map((hand, index) => (
                        <p key={index} className="text-xl font-bold text-yellow-400 animate-pulse">{hand.result}</p>
                    ))}
                </div>
            )}
        </div>
        
        <div className="flex items-start justify-center gap-4 min-h-[128px] md:min-h-[192px]">
            {playerHands.map((hand, index) => {
                const handResult = isFinished ? finalHandsWithResult.find((h, i) => i === index)?.resultType : null;
                const handGlowClass = 
                  handResult === 'win' ? 'shadow-[0_0_20px_theme(colors.green.500)]' : 
                  handResult === 'loss' ? 'shadow-[0_0_20px_theme(colors.red.500)]' : '';

                return (
                  <div key={index} className={`relative p-2 rounded-xl transition-all duration-300 ${index === activeHandIndex && gameState === 'player_turn' ? 'bg-white/10 ring-2 ring-purple-400' : ''} ${handGlowClass}`}>
                      {renderHand(hand.cards, true, index === activeHandIndex && gameState === 'player_turn')}
                      {renderScore(getHandValue(hand.cards), hand.cards.length > 0, hand)}
                  </div>
                )
            })}
        </div>
      </main>

      <footer className="bg-[#1a1b2f] py-3 px-4 border-t border-gray-700/50">
        <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-4">
            <div className="bg-[#21243e] p-3 rounded-lg flex flex-col gap-3">
                <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Bet</label>
                    <div className="flex items-center bg-[#2f324d] rounded-md p-1">
                        <button onClick={() => setBetAmount(v => Math.max(MIN_BET, v / 2))} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><MinusIcon className="w-5 h-5"/></button>
                        <input type="text" value={betInput} onChange={handleBetInputChange} onBlur={handleBetInputBlur} disabled={!isBettingPhase} className="w-24 bg-transparent text-center font-bold text-lg outline-none disabled:cursor-not-allowed" />
                        <span className="text-gray-500 pr-2 text-sm font-bold">EUR</span>
                        <button onClick={() => setBetAmount(v => Math.min(MAX_BET, v * 2))} disabled={!isBettingPhase} className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed bg-[#404566] rounded-md"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={handleHit} disabled={isPlayerActionsDisabled} className="flex flex-col items-center justify-center h-20 bg-[#2f324d] rounded-md text-gray-400 hover:text-white hover:bg-[#404566] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2f324d] p-1">
                        <HitIcon className="w-6 h-6" />
                        <span className="text-xs font-bold mt-1.5">Hit</span>
                    </button>
                    <button onClick={handleStand} disabled={isPlayerActionsDisabled} className="flex flex-col items-center justify-center h-20 bg-[#2f324d] rounded-md text-gray-400 hover:text-white hover:bg-[#404566] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2f324d] p-1">
                        <StandIcon className="w-6 h-6" />
                        <span className="text-xs font-bold mt-1.5">Stand</span>
                    </button>
                    <button onClick={handleSplit} disabled={!canSplit} className="flex flex-col items-center justify-center h-20 bg-[#2f324d] rounded-md text-gray-400 hover:text-white hover:bg-[#404566] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2f324d] p-1">
                        <SplitIcon className="w-6 h-6" />
                        <span className="text-xs font-bold mt-1.5">Split</span>
                    </button>
                    <button onClick={handleDouble} disabled={!canDouble} className="flex flex-col items-center justify-center h-20 bg-[#2f324d] rounded-md text-gray-400 hover:text-white hover:bg-[#404566] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2f324d] p-1">
                        <DoubleIcon className="w-6 h-6" />
                        <span className="text-xs font-bold mt-1.5">Double</span>
                    </button>
                </div>
            </div>

            <div className="w-full md:w-48 h-14 md:h-auto">
                <button
                    onClick={handleBet}
                    disabled={!profile || profile.balance < betAmount || !isBettingPhase}
                    className="w-full h-full text-2xl font-bold rounded-md bg-[#9dff00] hover:bg-[#8ee000] transition-colors text-black uppercase disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isBettingPhase ? 'Bet' : '...'}
                </button>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default BlackjackGame;