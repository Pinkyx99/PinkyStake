import React from 'react';
import useAnimatedBalance from '../hooks/useAnimatedBalance';
import { useUser } from '../contexts/UserContext';
import UserCircleIcon from './icons/UserCircleIcon';
import GiftIcon from './icons/GiftIcon';

interface HeaderProps {
  timeLeft: number;
  canClaim: boolean;
  onOpenCrate: () => void;
  onNavigate: (path: string) => void;
}

const formatTimeLeft = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const Header: React.FC<HeaderProps> = ({ timeLeft, canClaim, onOpenCrate, onNavigate }) => {
  const { profile } = useUser();
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

  return (
    <>
      <header 
        className="bg-gray-900/30 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-700/50"
        style={{ transform: 'translateZ(0)' }}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <a href="#/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} className="text-3xl font-extrabold tracking-tight cursor-pointer">
                <span style={{textShadow: '0 0 8px rgba(236, 72, 153, 0.6)'}} className="text-pink-400">Pinky</span>
                <span className="text-white">Stake</span>
              </a>
               <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
                  <a href="#/game/mysterybox" onClick={(e) => { e.preventDefault(); onNavigate('/game/mysterybox'); }} className="text-slate-300 hover:text-white transition-colors">Mystery Boxes</a>
                  <a href="#/game/csgo" onClick={(e) => { e.preventDefault(); onNavigate('/game/csgo'); }} className="text-slate-300 hover:text-white transition-colors">CSGO Gambling</a>
              </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={onOpenCrate} 
                  disabled={!canClaim}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${canClaim ? 'bg-yellow-500/20 text-yellow-300 animate-glow-pulse cursor-pointer' : 'bg-slate-800/50 text-gray-500 cursor-not-allowed'}`}
                  aria-label={canClaim ? 'Claim free crate' : 'Free crate not ready'}
                >
                    <GiftIcon className="w-6 h-6" />
                    <span className="font-bold text-sm">
                      {canClaim ? 'Claim!' : formatTimeLeft(timeLeft)}
                    </span>
                </button>
                <div className="relative">
                  <a href="#/profile" onClick={(e) => { e.preventDefault(); onNavigate('/profile'); }} className="flex items-center gap-3 p-1.5 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <div className="text-right">
                        <span className="font-bold text-white block text-sm">{profile?.username}</span>
                        <span className="text-xs text-yellow-400 font-semibold">{animatedBalance.toFixed(2)} EUR</span>
                      </div>
                     <UserCircleIcon className="h-8 w-8 text-slate-400" />
                  </a>
                </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;