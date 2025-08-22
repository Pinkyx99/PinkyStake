import React from 'react';
import type { Page } from '../../../App.tsx';
import { allCSGOCases } from './data.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import useAnimatedBalance from '../../../hooks/useAnimatedBalance.tsx';

interface CSGOCaseLobbyProps {
  setPage: (page: Page) => void;
}

const CSGOCaseLobby: React.FC<CSGOCaseLobbyProps> = ({ setPage }) => {
    const { profile } = useAuth();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

    return (
        <div className="csgo-page min-h-screen">
            <div className="csgo-sub-nav sticky top-0 z-20">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                         <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'lobby' })}>Mini Games</button>
                        <button className="csgo-sub-nav-item active" onClick={() => setPage({ name: 'csgo-lobby' })}>Cases</button>
                        <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-upgrader' })}>Upgrader</button>
                        <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-battles-lobby' })}>Case Battles</button>
                    </div>
                     {profile && (
                        <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
                            <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                            <span className="text-sm text-gray-400 ml-2">EUR</span>
                        </div>
                    )}
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold mb-6 text-center">Popular Cases</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {allCSGOCases.map(box => (
                        <div key={box.id} onClick={() => setPage({ name: 'csgo-case', id: box.id })} className="csgo-case-card-v3">
                            <div className="h-40 flex items-center justify-center p-2">
                                <img src={box.imageUrl} alt={box.name} className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110"/>
                            </div>
                            <h3 className="font-semibold text-center truncate mt-2">{box.name}</h3>
                            <p className="font-bold text-yellow-400 text-center mt-1">${box.price.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CSGOCaseLobby;