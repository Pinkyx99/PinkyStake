import React from 'react';
import GameCard from './GameCard.tsx';
import { Game } from '../types.ts';
import { Page } from '../App.tsx';
import AnimatedParticles from './AnimatedParticles.tsx';

interface LobbyPageProps {
    setPage: (page: Page) => void;
}

const mystakeGames: Game[] = [
    { id: 'chicken', title: 'Chicken', imageUrl: 'https://i.imgur.com/G6qTlfL.png', path: 'chicken' },
    { id: 'blackjack', title: 'Blackjack', imageUrl: 'https://i.imgur.com/RPHk2jO.png', path: 'blackjack' },
    { id: 'doors', title: 'Doors', imageUrl: 'https://i.imgur.com/BAqTa4B.png', path: 'doors' },
    { id: 'dice', title: 'Dice', imageUrl: 'https://i.imgur.com/iicPY6Q.png', path: 'dice' },
    { id: 'roulette', title: 'Roulette', imageUrl: 'https://i.imgur.com/rhKsCtB.png', path: 'roulette' },
    { id: 'crash', title: 'Crash', imageUrl: 'https://i.imgur.com/NgX3nQo.png', path: 'crash' },
    { id: 'flip', title: 'Flip', imageUrl: 'https://i.imgur.com/YXb145U.png', path: 'flip' },
    { id: 'limbo', title: 'Limbo', imageUrl: 'https://i.imgur.com/czEoaqW.png', path: 'limbo' },
    { id: 'keno', title: 'Keno', imageUrl: 'https://i.imgur.com/WD7rA93.png', path: 'keno' },
    { id: 'wheel', title: 'Wheel', imageUrl: 'https://i.imgur.com/fkSHYXG.png', path: 'wheel' },
    { id: 'plinko', title: 'Plinko', imageUrl: 'https://i.imgur.com/SwaP8OA.png', path: 'plinko' },
];

const LobbyPage: React.FC<LobbyPageProps> = ({ setPage }) => {
    const onSelect = (path: Page['name']) => {
        setPage({ name: path } as Page);
    };

    return (
        <div className="relative isolate overflow-hidden">
            <AnimatedParticles />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <section>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-8 text-center">
                        <span className="text-pink-400">Mini</span> Games
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {mystakeGames.map(game => (
                            <GameCard 
                                key={game.id} 
                                game={game} 
                                onSelect={() => onSelect(game.path as Page['name'])} 
                            />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LobbyPage;