
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import AnimatedParticles from './components/AnimatedParticles';
import ErrorBoundary from './components/ErrorBoundary';
import { type Game } from './types';
import ChickenGame from './components/games/ChickenGame';
import BlackjackGame from './components/games/BlackjackGame';
import DoorsGame from './components/games/DoorsGame';
import DiceGame from './components/games/DiceGame';
import RouletteGame from './components/games/RouletteGame';
import CrashGame from './components/games/CrashGame';
import LimboGame from './components/games/LimboGame';
import KenoGame from './components/games/KenoGame';
import WheelGame from './components/games/WheelGame';
import PumpGame from './components/games/PumpGame';
import FlipGame from './components/games/FlipGame';

const GAMES: Game[] = [
  { id: 1, title: '', slug: 'chicken', imageUrl: 'https://i.imgur.com/8PdQTGW.png', color: 'orange' },
  { id: 2, title: '', slug: 'blackjack', imageUrl: 'https://i.imgur.com/5ui2vxB.png', color: 'purple' },
  { id: 3, title: '', slug: 'doors', imageUrl: 'https://i.imgur.com/ntkG6tv.png', color: 'blue' },
  { id: 16, title: '', slug: 'roulette', imageUrl: 'https://i.imgur.com/eqkkVYJ.png', color: 'red' },
  { id: 14, title: '', slug: 'dice', imageUrl: 'https://i.imgur.com/Uy1mnkF.png', color: 'green' },
  { id: 4, title: '', slug: 'crash', imageUrl: 'https://i.imgur.com/cu8O4GF.png', color: 'purple' },
  { id: 17, title: '', slug: 'limbo', imageUrl: 'https://i.imgur.com/picS5KQ.png', color: 'purple' },
  { id: 18, title: '', slug: 'keno', imageUrl: 'https://i.imgur.com/uKMIrL9.png', color: 'blue' },
  { id: 19, title: '', slug: 'wheel', imageUrl: 'https://i.imgur.com/7xzgBDx.png', color: 'yellow' },
  { id: 20, title: '', slug: 'pump', imageUrl: 'https://i.imgur.com/4qoWhQi.png', color: 'red' },
  { id: 21, title: '', slug: 'flip', imageUrl: 'https://i.imgur.com/nxpJKT1.png', color: 'yellow' },
  { id: 5, title: '', imageUrl: 'https://i.imgur.com/wI4Vv3M.png', color: 'purple' },
  { id: 6, title: '', imageUrl: 'https://i.imgur.com/yO8pB9f.png', color: 'green' },
  { id: 7, title: '', imageUrl: 'https://i.imgur.com/3q1sJ2L.png', color: 'brown' },
  { id: 8, title: '', imageUrl: 'https://i.imgur.com/s6p4eF8.png', color: 'teal' },
  { id: 9, title: '', imageUrl: 'https://i.imgur.com/5J7m1jR.png', color: 'yellow' },
  { id: 10, title: '', imageUrl: 'https://i.imgur.com/9n9s8Z2.png', color: 'green' },
  { id: 11, title: '', imageUrl: 'https://i.imgur.com/9f8D4K7.png', color: 'blue' },
  { id: 12, title: '', imageUrl: 'https://i.imgur.com/cO1k2L4.png', color: 'pink' },
  { id: 13, title: '', imageUrl: 'https://i.imgur.com/z1kH0B5.png', color: 'cyan' },
];

const MainPage: React.FC<{ onGameSelect: (game: Game) => void }> = ({ onGameSelect }) => (
  <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="text-center mb-16">
      <h1 className="font-bebas text-6xl md:text-8xl font-black uppercase tracking-widest drop-shadow-2xl">
        <span className="text-white text-glow-purple">MINI</span> <span className="text-yellow-400 animate-title-glow">GAMES</span>
      </h1>
    </div>
    <div>
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
        {GAMES.map(game => (
          <GameCard key={game.id} game={game} onSelect={() => onGameSelect(game)} />
        ))}
      </div>
    </div>
  </main>
);

const App: React.FC = () => {
  const getPath = () => window.location.hash.substring(1) || '/';
  const [path, setPath] = useState(getPath());

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
    setPath(to);
  }, []);
  
  useEffect(() => {
    const handleHashChange = () => setPath(getPath());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const handleGameSelect = (game: Game) => {
    if (game.slug && ['chicken', 'blackjack', 'doors', 'dice', 'roulette', 'crash', 'limbo', 'keno', 'wheel', 'pump', 'flip'].includes(game.slug)) {
      navigate(`/game/${game.slug}`);
    } else {
      alert(`The game "${game.title || 'selected game'}" is not yet implemented.`);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const renderPage = () => {
    const parts = path.split('/').filter(Boolean);
    const route = parts[0];

    const gameSlug = parts[1];
    if (route === 'game') {
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
        case 'pump': return <PumpGame onBack={handleGoBack} />;
        case 'flip': return <FlipGame onBack={handleGoBack} />;
        default:
          return null;
      }
    }
    
    return (
      <div className="relative min-h-screen w-full bg-[#1a1d3a] text-white font-poppins overflow-x-hidden">
        <AnimatedParticles />
        <Header />
        <div className="relative z-10" style={{ isolation: 'isolate' }}>
           <MainPage onGameSelect={handleGameSelect} />
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      {renderPage()}
    </ErrorBoundary>
  );
};

export default App;