
import React from 'react';
import ArrowLeftIcon from '../../icons/ArrowLeftIcon';
import useAnimatedBalance from '../../../hooks/useAnimatedBalance';
import { useUser } from '../../../contexts/UserContext';
import { allMysteryBoxes } from './data';
import MysteryBoxCard from './MysteryBoxCard';
import type { MysteryBox } from '../../../types';

interface MysteryBoxLobbyProps {
  onBack: () => void;
  onNavigate: (path: string) => void;
}

const MysteryBoxLobby: React.FC<MysteryBoxLobbyProps> = ({ onBack, onNavigate }) => {
    const { profile } = useUser();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

    const handleSelectBox = (box: MysteryBox) => {
        onNavigate(`/game/mysterybox/${box.id}`);
    };

    return (
        <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white">
            <header className="shrink-0 w-full bg-[#1a1b2f] p-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-cyan-400 text-xl font-bold uppercase">Mystery Boxes</h1>
                </div>
                <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold">Choose a Box</h2>
                    <p className="text-slate-400 mt-2">Pick your poison. What treasures await inside?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allMysteryBoxes.map(box => (
                        <MysteryBoxCard key={box.id} box={box} onSelect={() => handleSelectBox(box)} />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default MysteryBoxLobby;
