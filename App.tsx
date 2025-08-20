
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import AnimatedParticles from './components/AnimatedParticles';
import ErrorBoundary from './components/ErrorBoundary';
import { type Game, type CSGOBattle } from './types';
import ChickenGame from './components/games/ChickenGame';
import BlackjackGame from './components/games/BlackjackGame';
import DoorsGame from './components/games/DoorsGame';
import DiceGame from './components/games/DiceGame';
import RouletteGame from './components/games/RouletteGame';
import CrashGame from './components/games/CrashGame';
import LimboGame from './components/games/LimboGame';
import KenoGame from './components/games/KenoGame';
import WheelGame from './components/games/WheelGame';
import FlipGame from './components/games/FlipGame';
import MinesGame from './components/games/MinesGame';
import MysteryBoxGame from './components/games/MysteryBoxGame';
import MysteryBoxLobby from './components/games/mysterybox/MysteryBoxLobby';
import { allMysteryBoxes } from './components/games/mysterybox/data';
import CSGOGame from './components/games/CSGOGame';
import CSGOCaseLobby from './components/games/csgo/CSGOCaseLobby';
import { allCSGOCases } from './components/games/csgo/data';
import ProfilePage from './components/ProfilePage';
import CSGOUpgrader from './components/games/csgo/CSGOUpgrader';
import CSGOCaseBattlesLobby from './components/games/csgo/CSGOCaseBattlesLobby';
import { useFreeCrate } from './hooks/useFreeCrate';
import PrizeToast from './components/PrizeToast';
import { useUser } from './contexts/UserContext';
import { GoogleGenAI, Chat } from '@google/genai';
import ChatIcon from './components/icons/ChatIcon';
import SendIcon from './components/icons/SendIcon';
import SpinnerIcon from './components/icons/SpinnerIcon';
import CloseIcon from './components/icons/CloseIcon';


const ALL_GAMES: Game[] = [
  { id: 1, title: 'Chicken', slug: 'chicken', imageUrl: 'https://i.imgur.com/8PdQTGW.png', color: 'orange' },
  { id: 2, title: 'Blackjack', slug: 'blackjack', imageUrl: 'https://i.imgur.com/5ui2vxB.png', color: 'purple' },
  { id: 3, title: 'Doors', slug: 'doors', imageUrl: 'https://i.imgur.com/ntkG6tv.png', color: 'blue' },
  { id: 16, title: 'Roulette', slug: 'roulette', imageUrl: 'https://i.imgur.com/eqkkVYJ.png', color: 'red' },
  { id: 14, title: 'Dice', slug: 'dice', imageUrl: 'https://i.imgur.com/Uy1mnkF.png', color: 'green' },
  { id: 4, title: 'Crash', slug: 'crash', imageUrl: 'https://i.imgur.com/cu8O4GF.png', color: 'purple' },
  { id: 17, title: 'Limbo', slug: 'limbo', imageUrl: 'https://i.imgur.com/picS5KQ.png', color: 'purple' },
  { id: 18, title: 'Keno', slug: 'keno', imageUrl: 'https://i.imgur.com/uKMIrL9.png', color: 'blue' },
  { id: 19, title: 'Wheel', slug: 'wheel', imageUrl: 'https://i.imgur.com/7xzgBDx.png', color: 'yellow' },
  { id: 21, title: 'Flip', slug: 'flip', imageUrl: 'https://i.imgur.com/nxpJKT1.png', color: 'yellow' },
  { id: 22, title: 'Mystery Boxes', slug: 'mysterybox', imageUrl: 'https://i.imgur.com/6l3v02N.png', color: 'cyan' },
  { id: 23, title: 'CSGO Gambling', slug: 'csgo', imageUrl: 'https://i.imgur.com/sIqj4t2.png', color: 'teal' },
  { id: 6, title: '', imageUrl: 'https://i.imgur.com/yO8pB9f.png', color: 'green' },
  { id: 7, title: '', imageUrl: 'https://i.imgur.com/3q1sJ2L.png', color: 'brown' },
  { id: 8, title: '', imageUrl: 'https://i.imgur.com/s6p4eF8.png', color: 'teal' },
  { id: 9, title: '', imageUrl: 'https://i.imgur.com/5J7m1jR.png', color: 'yellow' },
  { id: 10, title: '', imageUrl: 'https://i.imgur.com/9n9s8Z2.png', color: 'green' },
  { id: 11, title: '', imageUrl: 'https://i.imgur.com/9f8D4K7.png', color: 'blue' },
  { id: 12, title: '', imageUrl: 'https://i.imgur.com/cO1k2L4.png', color: 'pink' },
  { id: 13, title: '', imageUrl: 'https://i.imgur.com/z1kH0B5.png', color: 'cyan' },
];

const GAMES: Game[] = ALL_GAMES.filter(game => game.slug && !['mysterybox', 'csgo'].includes(game.slug));

const MainPage: React.FC<{ onGameSelect: (game: Game) => void }> = ({ onGameSelect }) => (
  <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="text-center mb-16">
      <h1 className="font-bebas text-6xl md:text-8xl font-black uppercase tracking-widest drop-shadow-2xl">
        <span className="text-white text-glow-purple">MINI</span> <span className="text-yellow-400 animate-title-glow">GAMES</span>
      </h1>
    </div>
    <div>
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
        {GAMES.map(game => (
          <GameCard key={game.id} game={game} onSelect={() => onGameSelect(game)} />
        ))}
      </div>
    </div>
  </main>
);

type Message = {
  role: 'user' | 'model';
  content: string;
};

const ChatPanel: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Hello! I'm G-Mini, your friendly game assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const apiKeyAvailable = typeof process !== 'undefined' && process.env && process.env.API_KEY;

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, scrollToBottom]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        let chat = chatRef.current;
        if (!chat) {
            try {
                if (!apiKeyAvailable) {
                    throw new Error("API key not available.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "You are a friendly and helpful assistant for a gaming website. Be concise and upbeat. Your name is G-Mini. Don't mention you are an AI model."
                    }
                });
                chatRef.current = chat;
            } catch (error) {
                console.error("Gemini API initialization error:", error);
                setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later." }]);
                return;
            }
        }

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const messageToSend = input;
        setInput('');
        setLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: messageToSend });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                       lastMessage.content = modelResponse;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
      <div className={`fixed bottom-6 right-6 z-[70] w-full max-w-sm rounded-xl shadow-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col h-[60vh]">
          <header className="flex items-center justify-between p-3 border-b border-slate-700">
            <h3 className="font-bold text-white">Game Assistant</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
          </header>
          <div className="flex-grow p-3 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                  <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none">
                      <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-slate-700">
             {!apiKeyAvailable ? (
                <p className="text-center text-xs text-yellow-400">API_KEY not configured. Chat is disabled.</p>
             ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask something..."
                        className="flex-grow bg-slate-800 border border-slate-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" disabled={loading} className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full transition-colors hover:bg-purple-700 disabled:bg-slate-600">
                        {loading ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                    </button>
                </form>
             )}
          </div>
        </div>
      </div>
    );
};


const App: React.FC = () => {
  const getPath = () => window.location.hash.substring(1) || '/';
  const [path, setPath] = useState(getPath());
  const { adjustBalance } = useUser();
  const { timeLeft, canClaim, resetTimer } = useFreeCrate();
  const [toast, setToast] = useState<{ message: string; amount: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [csgoBattles, setCsgoBattles] = useState<CSGOBattle[]>([]);

  useEffect(() => {
    // Clear timer on unmount to prevent memory leaks or state updates on unmounted component
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  
  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);
  
  useEffect(() => {
    const handleHashChange = () => setPath(getPath());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const handleGameSelect = (game: Game) => {
    if (game.slug) {
      navigate(`/game/${game.slug}`);
    } else {
      alert(`The game "${game.title || 'selected game'}" is not yet implemented.`);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };
  
  const generatePrize = () => {
    const r = Math.random();
    if (r < 0.01) return 50; // 1% for $50
    if (r < 0.15) return 10; // 14% for $10
    if (r < 0.30) return 6;  // 15% for $6
    if (r < 0.45) return 4;  // 15% for $4
    if (r < 0.60) return 2;  // 15% for $2
    
    // Remaining 40%
    const remainingR = Math.random();
    if (remainingR < 0.75) { // 30% of total
        // Common low-tier prizes $1, $3, $5, $7, $8, $9
        const commonLow = [1, 3, 5, 7, 8, 9];
        return commonLow[Math.floor(Math.random() * commonLow.length)];
    } else { // 10% of total
        // Higher-tier prizes $11 - $49
        return Math.floor(Math.random() * (49 - 11 + 1)) + 11;
    }
  };

  const handleClaimFreePrize = () => {
      if (!canClaim) return;

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      const prize = generatePrize();
      adjustBalance(prize);
      resetTimer();
      setToast({ message: "Free money from owner :)", amount: prize });

      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 4000); // Duration matches the CSS animation
  };

  const handleToggleChat = () => setIsChatOpen(prev => !prev);

  const renderPage = () => {
    const parts = path.split('/').filter(Boolean);
    const route = parts[0];

    if (route === 'profile') {
        return <ProfilePage onBack={handleGoBack} />;
    }

    if (route === 'game') {
      const gameSlug = parts[1];

      if (gameSlug === 'mysterybox') {
        const boxId = parts[2];
        if (boxId) {
            const selectedBox = allMysteryBoxes.find(b => b.id === boxId);
            if (selectedBox) {
                return <MysteryBoxGame onBack={() => navigate('/game/mysterybox')} box={selectedBox} />;
            }
        }
        return <MysteryBoxLobby onBack={handleGoBack} onNavigate={navigate} />;
      }
      
      if (gameSlug === 'csgo') {
          const subRoute = parts[2];
          const dynamicId = parts[3];

          if (subRoute === 'upgrader') {
              return <CSGOUpgrader onBack={() => navigate('/game/csgo')} />;
          }
          if (subRoute === 'battles') {
              return <CSGOCaseBattlesLobby battleId={dynamicId} battles={csgoBattles} setBattles={setCsgoBattles} onNavigate={navigate} />;
          }
          if (subRoute) { // Must be a caseId
              const selectedCase = allCSGOCases.find(c => c.id === subRoute);
              if (selectedCase) {
                  return <CSGOGame onBack={() => navigate('/game/csgo')} case={selectedCase} />;
              }
          }
          return <CSGOCaseLobby onBack={handleGoBack} onNavigate={navigate} />;
      }
      
      switch(gameSlug) {
        case 'chicken': return <ChickenGame onBack={handleGoBack} />;
        case 'blackjack': return <BlackjackGame onBack={handleGoBack} />;
        case 'doors': return <DoorsGame onBack={handleGoBack} />;
        case 'dice': return <DiceGame onBack={handleGoBack} />;
        case 'roulette': return <RouletteGame onBack={handleGoBack} />;
        case 'crash': return <CrashGame onBack={handleGoBack} />;
        case 'limbo': return <LimboGame onBack={handleGoBack} />;
        case 'keno': return <KenoGame onBack={handleGoBack} />;
        case 'wheel': return <WheelGame onBack={handleGoBack} />;
        case 'flip': return <FlipGame onBack={handleGoBack} />;
        case 'mines': return <MinesGame onBack={handleGoBack} />;
        default:
          return null;
      }
    }
    
    return (
      <>
        <div className="relative min-h-screen w-full bg-[#1a1d3a] text-white font-poppins overflow-x-hidden">
          <AnimatedParticles />
          <Header 
            timeLeft={timeLeft}
            canClaim={canClaim}
            onOpenCrate={handleClaimFreePrize}
            onNavigate={navigate}
          />
          <div className="relative z-10" style={{ isolation: 'isolate' }}>
             <MainPage onGameSelect={handleGameSelect} />
          </div>
        </div>
        {toast && (
            <PrizeToast
                message={toast.message}
                amount={toast.amount}
            />
        )}
      </>
    );
  };

  return (
    <ErrorBoundary>
      {renderPage()}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <button
        onClick={handleToggleChat}
        className={`fixed bottom-6 right-6 z-[60] w-16 h-16 bg-purple-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ease-in-out hover:bg-purple-700 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50
          ${isChatOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
        aria-label="Toggle Chat"
      >
        <ChatIcon className="w-8 h-8" />
      </button>
    </ErrorBoundary>
  );
};

export default App;
