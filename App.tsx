import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext.tsx';
import AuthPage from './components/AuthPage.tsx';
import LeaderboardPage from './components/LeaderboardPage.tsx';
import Header from './components/Header.tsx';
import LobbyPage from './components/LobbyPage.tsx';
import CSGOCaseLobby from './components/games/csgo/CSGOCaseLobby.tsx';
import MysteryBoxLobby from './components/games/mysterybox/MysteryBoxLobby.tsx';
import CSGOGame from './components/games/csgo/CSGOGame.tsx';
import MysteryBoxGame from './components/games/MysteryBoxGame.tsx';
import { allCSGOCases } from './components/games/csgo/data.ts';
import { allMysteryBoxes } from './components/games/mysterybox/data.ts';
import ChickenGame from './components/games/ChickenGame.tsx';
import BlackjackGame from './components/games/BlackjackGame.tsx';
import DoorsGame from './components/games/DoorsGame.tsx';
import DiceGame from './components/games/DiceGame.tsx';
import RouletteGame from './components/games/RouletteGame.tsx';
import CrashGame from './components/games/CrashGame.tsx';
import FlipGame from './components/games/FlipGame.tsx';
import LimboGame from './components/games/LimboGame.tsx';
import KenoGame from './components/games/KenoGame.tsx';
import WheelGame from './components/games/WheelGame.tsx';
import PlinkoGame from './components/games/PlinkoGame.tsx';
import CSGOUpgrader from './components/games/csgo/CSGOUpgrader.tsx';
import CSGOCaseBattlesLobby from './components/games/csgo/CSGOCaseBattlesLobby.tsx';
import AdminConsole from './components/AdminConsole.tsx';
import CloseIcon from './components/icons/CloseIcon.tsx';
import Chat from './components/Chat.tsx';
import UserProfileModal from './components/UserProfileModal.tsx';
import MoneyRainBanner from './components/MoneyRainBanner.tsx';
import { supabase } from './lib/supabaseClient.ts';
import type { Profile, MoneyRain, CSGOInventoryItem, CSGOItem, CSGOBattle } from './types.ts';

export type Page = 
  | { name: 'lobby' }
  | { name: 'leaderboard' }
  | { name: 'csgo-lobby' }
  | { name: 'csgo-case'; id: string }
  | { name: 'csgo-upgrader' }
  | { name: 'csgo-battles-lobby' }
  | { name: 'csgo-battles'; id: string }
  | { name: 'mysterybox-lobby' }
  | { name: 'mysterybox-case'; id: string }
  | { name: 'chicken' }
  | { name: 'blackjack' }
  | { name: 'doors' }
  | { name: 'dice' }
  | { name: 'roulette' }
  | { name: 'crash' }
  | { name: 'flip' }
  | { name: 'limbo' }
  | { name: 'keno' }
  | { name: 'wheel' }
  | { name: 'plinko' };

const AnnouncementBanner: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="bg-purple-600 text-white text-center p-2 flex items-center justify-center gap-4 relative">
        <p className="font-semibold">{message}</p>
        <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
            <CloseIcon className="w-5 h-5" />
        </button>
    </div>
);

const App: React.FC = () => {
    const { profile, isAdmin } = useAuth();
    const [page, setPage] = useState<Page>({ name: 'lobby' });
    const [isConsoleVisible, setIsConsoleVisible] = useState(false);
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
    const [activeRain, setActiveRain] = useState<MoneyRain | null>(null);
    
    // CSGO Specific State
    const [csgoInventory, setCsgoInventory] = useState<CSGOInventoryItem[]>([]);
    const [activeBattles, setActiveBattles] = useState<CSGOBattle[]>([]);

    const addToCsgoInventory = (items: CSGOItem[]) => {
        const newInventoryItems: CSGOInventoryItem[] = items.map(item => ({
            ...item,
            instanceId: `${item.id}-${Date.now()}-${Math.random()}`
        }));
        setCsgoInventory(prev => [...prev, ...newInventoryItems]);
    };

    const removeFromCsgoInventory = (instanceIds: string[]) => {
        setCsgoInventory(prev => prev.filter(item => !instanceIds.includes(item.instanceId)));
    };


    useEffect(() => {
        const channel = supabase.channel('money-rains')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'money_rains' }, (payload) => {
                const newRain = payload.new as MoneyRain;
                if (new Date(newRain.expires_at) > new Date()) {
                    setActiveRain(newRain);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!profile) {
        return <AuthPage />;
    }
    
    const renderPage = () => {
        switch (page.name) {
            case 'lobby':
                return <LobbyPage setPage={setPage} />;
            case 'leaderboard':
                return <LeaderboardPage onBack={() => setPage({ name: 'lobby' })} />;
            case 'csgo-lobby':
                return <CSGOCaseLobby setPage={setPage} />;
            case 'csgo-upgrader':
                return <CSGOUpgrader 
                           setPage={setPage}
                           inventory={csgoInventory}
                           addToInventory={addToCsgoInventory}
                           removeFromInventory={removeFromCsgoInventory} 
                       />;
            case 'csgo-battles-lobby':
                 return <CSGOCaseBattlesLobby battles={activeBattles} setBattles={setActiveBattles} setPage={setPage} />;
            case 'csgo-battles':
                 return <CSGOCaseBattlesLobby battles={activeBattles} setBattles={setActiveBattles} setPage={setPage} battleId={page.id} />;
            case 'mysterybox-lobby':
                return <MysteryBoxLobby onBack={() => setPage({ name: 'lobby' })} onNavigate={(path) => {}} />;
            case 'csgo-case':
                const selectedCase = allCSGOCases.find(c => c.id === page.id);
                if (!selectedCase) {
                    return <div className="text-center p-8 text-white">Case not found. <button onClick={() => setPage({name: 'csgo-lobby'})} className="text-pink-400 underline">Return to lobby.</button></div>;
                }
                return <CSGOGame setPage={setPage} case={selectedCase} addToCsgoInventory={addToCsgoInventory} />;
            case 'mysterybox-case':
                const selectedBox = allMysteryBoxes.find(b => b.id === page.id);
                if (!selectedBox) {
                    return <div className="text-center p-8 text-white">Box not found. <button onClick={() => setPage({name: 'mysterybox-lobby'})} className="text-pink-400 underline">Return to lobby.</button></div>;
                }
                return <MysteryBoxGame onBack={() => setPage({ name: 'mysterybox-lobby' })} box={selectedBox} />;
            case 'chicken':
                return <ChickenGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'blackjack':
                return <BlackjackGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'doors':
                return <DoorsGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'dice':
                return <DiceGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'roulette':
                return <RouletteGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'crash':
                return <CrashGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'flip':
                return <FlipGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'limbo':
                return <LimboGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'keno':
                return <KenoGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'wheel':
                return <WheelGame onBack={() => setPage({ name: 'lobby' })} />;
            case 'plinko':
                return <PlinkoGame onBack={() => setPage({ name: 'lobby' })} />;
            default:
                return <LobbyPage setPage={setPage} />;
        }
    }

    return (
        <div className="min-h-screen w-full">
            {activeRain && <MoneyRainBanner rain={activeRain} onClaimed={() => setActiveRain(null)} />}
            {announcement && <AnnouncementBanner message={announcement} onClose={() => setAnnouncement(null)} />}
            
            {page.name === 'lobby' && 
                <Header 
                    setPage={setPage} 
                    onToggleConsole={() => setIsConsoleVisible(v => !v)}
                    onToggleChat={() => setIsChatVisible(v => !v)}
                />}
                
            <div className={`transition-transform duration-300 ${isChatVisible ? 'mr-[350px]' : ''}`}>
                {renderPage()}
            </div>
            
            {isAdmin && <AdminConsole isVisible={isConsoleVisible} onAnnounce={setAnnouncement} />}
            <Chat isVisible={isChatVisible} onProfileClick={setViewingProfile} />
            {viewingProfile && <UserProfileModal userProfile={viewingProfile} onClose={() => setViewingProfile(null)} />}
        </div>
    );
};

export default App;