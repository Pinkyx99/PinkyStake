
import React, { useMemo } from 'react';
import { useUser } from '../../../contexts/UserContext';
import useAnimatedBalance from '../../../hooks/useAnimatedBalance';
import { allCSGOCases } from './data';
import type { CSGOCase } from '../../../types';
import ArrowLeftIcon from '../../icons/ArrowLeftIcon';
import CSGOCaseCard from './CSGOCaseCard';
import CoinIcon from '../../icons/CoinIcon';

interface CSGOCaseLobbyProps {
  onBack: () => void;
  onNavigate: (path: string) => void;
}

const CSGOCaseLobby: React.FC<CSGOCaseLobbyProps> = ({ onBack, onNavigate }) => {
    const { profile } = useUser();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

    const handleSelectCase = (csgoCase: CSGOCase) => {
        onNavigate(`/game/csgo/${csgoCase.id}`);
    };

    const { minPrice, maxPrice } = useMemo(() => {
        if (allCSGOCases.length === 0) return { minPrice: 0, maxPrice: 0 };
        const prices = allCSGOCases.flatMap(c => c.items.map(i => i.price));
        if (prices.length === 0) return { minPrice: 0, maxPrice: 0 };
        return {
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
        };
    }, []);

    const featuredCase = allCSGOCases[0];

    return (
        <div className="csgo-lobby-page min-h-screen">
            <header className="shrink-0 w-full bg-[#1a1b2f]/50 backdrop-blur-sm p-3 flex items-center justify-between z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} aria-label="Back to games" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold uppercase text-red-500">CSGO</h1>
                </div>
                <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
                    <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-2">EUR</span>
                </div>
            </header>
            
            <div className="price-ticker-marquee">
                <div className="price-ticker-content">
                    {Array(4).fill(0).map((_, i) => (
                        <React.Fragment key={i}>
                            <div className="price-ticker-item">
                                <span>Lowest Price:</span><span className="text-green-400">${minPrice.toFixed(2)}</span>
                            </div>
                            <div className="price-ticker-item">
                                <span>Highest Price:</span><span className="text-yellow-400">${maxPrice.toFixed(2)}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
            <div className="csgo-sub-nav">
                <div className="container mx-auto flex items-center">
                    <button className="csgo-sub-nav-item active">Cases</button>
                    <button className="csgo-sub-nav-item" onClick={() => onNavigate('/game/csgo/upgrader')}>
                        Upgrader
                    </button>
                     <button className="csgo-sub-nav-item" onClick={() => onNavigate('/game/csgo/battles')}>
                        Case Battles
                    </button>
                     <button className="csgo-sub-nav-item coming-soon" onClick={() => alert('Coming Soon!')}>
                        Contracts
                        <span className="coming-soon-badge">SOON</span>
                    </button>
                </div>
            </div>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-12">
                {featuredCase && (
                    <section className="csgo-hero-banner">
                        <div className="csgo-hero-bg" style={{backgroundImage: `url('${featuredCase.imageUrl}')`}}></div>
                        <div className="relative z-10 flex flex-col items-center text-center md:items-start md:text-left order-2 md:order-1">
                            <h2 className="csgo-hero-title">{featuredCase.name}</h2>
                            <p className="csgo-hero-price">${featuredCase.price.toFixed(2)}</p>
                            <button onClick={() => handleSelectCase(featuredCase)} className="csgo-hero-button">
                                Open Case
                            </button>
                        </div>
                         <div className="relative z-10 order-1 md:order-2">
                             <img src={featuredCase.imageUrl} alt={featuredCase.name} className="csgo-hero-image" />
                         </div>
                    </section>
                )}

                <section>
                    <h2 className="text-2xl font-bold mb-6 text-white">All Cases</h2>
                    {allCSGOCases.length > 0 ? (
                        <div className="csgo-cases-grid">
                            {allCSGOCases.map(box => (
                                <CSGOCaseCard key={box.id} box={box} onSelect={() => handleSelectCase(box)} />
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full text-center py-16 bg-slate-800/20 rounded-lg">
                            <h3 className="text-2xl font-bold text-slate-300">No Cases Found</h3>
                            <p className="text-slate-500 mt-2">There are currently no cases available to open.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CSGOCaseLobby;