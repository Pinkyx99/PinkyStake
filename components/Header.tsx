

import React from 'react';
import useAnimatedBalance from '../hooks/useAnimatedBalance';
import { useUser } from '../contexts/UserContext';
import UserCircleIcon from './icons/UserCircleIcon';

const Header: React.FC = () => {
  const { profile } = useUser();
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

  return (
    <header 
      className="bg-gray-900/30 backdrop-blur-sm sticky top-0 z-50"
      style={{ transform: 'translateZ(0)' }}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <a href="#/" onClick={(e) => { e.preventDefault(); window.location.hash = '/'; }} className="text-3xl font-extrabold tracking-tight cursor-pointer">
              <span style={{textShadow: '0 0 8px rgba(96, 165, 250, 0.5)'}} className="text-blue-400">My</span>
              <span className="text-white">Stake</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 p-1.5 bg-slate-800/50 rounded-lg">
                  <div className="text-right">
                    <span className="font-bold text-white block text-sm">{profile?.username}</span>
                    <span className="text-xs text-yellow-400 font-semibold">{animatedBalance.toFixed(2)} EUR</span>
                  </div>
                 <UserCircleIcon className="h-8 w-8 text-slate-400" />
              </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
