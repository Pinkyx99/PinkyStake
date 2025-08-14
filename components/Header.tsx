

import React, { useState, useRef, useEffect } from 'react';
import useAnimatedBalance from '../hooks/useAnimatedBalance';
import { useUser } from '../contexts/UserContext';
import TrophyIcon from './icons/TrophyIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface HeaderProps {
  onShowLeaderboard: () => void;
  onSignInClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowLeaderboard, onSignInClick }) => {
  const { profile, session, signOut, loading } = useUser();
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await signOut();
    // Use window location to ensure a full refresh to home page after logout
    window.location.href = '/';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGuest = !session;

  return (
    <header 
      className="bg-gray-900/30 backdrop-blur-sm sticky top-0 z-50"
      style={{ transform: 'translateZ(0)' }}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }} className="text-3xl font-extrabold tracking-tight cursor-pointer">
              <span style={{textShadow: '0 0 8px rgba(96, 165, 250, 0.5)'}} className="text-blue-400">My</span>
              <span className="text-white">Stake</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onShowLeaderboard} 
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
              aria-label="Show leaderboard"
            >
              <TrophyIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>

            {loading ? <div className="w-24 h-10 bg-slate-700/50 rounded-lg animate-pulse" /> : isGuest ? (
              <button 
                onClick={onSignInClick}
                className="px-5 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-colors"
              >
                Sign In
              </button>
            ) : (
              <div ref={profileRef} className="relative">
                <button 
                  onClick={() => setIsProfileOpen(p => !p)} 
                  className="flex items-center gap-3 p-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <div className="text-right">
                      <span className="font-bold text-white block text-sm">{profile?.username}</span>
                      <span className="text-xs text-yellow-400 font-semibold">{animatedBalance.toFixed(2)} EUR</span>
                    </div>
                   <UserCircleIcon className="h-8 w-8 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black/5">
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700/50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
