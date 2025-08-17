import React from 'react';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../hooks/useAnimatedBalance';
import { useUser } from '../../contexts/UserContext';

interface CSGOGameProps {
  onBack: () => void;
}

const CSGOGame: React.FC<CSGOGameProps> = ({ onBack }) => {
  const { profile } = useUser();
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white select-none">
      <header className="shrink-0 w-full bg-[#1a1b2f] p-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
              <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                  <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <h1 className="text-teal-400 text-xl font-bold uppercase">CSGO Gambling</h1>
          </div>
          <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
              <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
              <span className="text-sm text-gray-400 ml-2">EUR</span>
          </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">CSGO Gambling</h2>
          <p className="text-lg text-gray-400">Case Battles, Upgrader, and more are coming soon!</p>
          <p className="text-gray-500">Prepare for the ultimate skin gambling experience.</p>
        </div>
      </main>
    </div>
  );
};

export default CSGOGame;