import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Page } from '../App.tsx';
import SlidersIcon from './icons/SlidersIcon.tsx';
import ChatIcon from './icons/ChatIcon.tsx';
import NotificationBell from './NotificationBell.tsx';


interface HeaderProps {
    setPage: (page: Page) => void;
    onToggleConsole: () => void;
    onToggleChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ setPage, onToggleConsole, onToggleChat }) => {
    const { profile, signOut, isAdmin } = useAuth();

    return (
        <header className="bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-700/50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-8">
                        <a onClick={() => setPage({ name: 'lobby' })} className="text-3xl font-extrabold tracking-tight cursor-pointer">
                            <span className="text-pink-400">Supabase</span>
                            <span className="text-white">Casino</span>
                        </a>
                        <div className="hidden md:flex items-center gap-6">
                            <button onClick={() => setPage({ name: 'leaderboard' })} className="text-lg font-bold text-white hover:text-pink-400 transition-colors">Leaderboard</button>
                            <button onClick={() => setPage({ name: 'csgo-lobby' })} className="text-lg font-bold text-white hover:text-pink-400 transition-colors">CS-GO</button>
                            <button onClick={() => setPage({ name: 'mysterybox-lobby' })} className="text-lg font-bold text-white hover:text-pink-400 transition-colors">Mystery Box</button>
                        </div>
                    </div>

                    {profile && (
                        <div className="flex items-center gap-4">
                             {isAdmin && (
                                <button
                                    onClick={onToggleConsole}
                                    className="p-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                                    aria-label="Toggle Admin Console"
                                    title="Toggle Admin Console"
                                >
                                    <SlidersIcon className="w-5 h-5" />
                                </button>
                            )}
                            <NotificationBell />
                            <button
                                onClick={onToggleChat}
                                className="p-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                                aria-label="Toggle Chat"
                                title="Toggle Chat"
                            >
                                <ChatIcon className="w-5 h-5" />
                            </button>
                            <div className="text-right">
                                <span className="font-bold text-white block text-sm">{profile.username}</span>
                                <span className="text-xs text-yellow-400 font-semibold">{profile.balance.toFixed(2)} EUR</span>
                            </div>
                            <button
                                onClick={signOut}
                                className="px-4 py-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                                aria-label="Sign Out"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;