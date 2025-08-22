import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import type { Profile } from '../types.ts';
import SpinnerIcon from './icons/SpinnerIcon.tsx';
import ArrowLeftIcon from './icons/ArrowLeftIcon.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import useAnimatedBalance from '../hooks/useAnimatedBalance.tsx';

interface LeaderboardPageProps {
    onBack: () => void;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack }) => {
    const [leaderboard, setLeaderboard] = useState<Pick<Profile, 'username' | 'balance'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { profile } = useAuth();
    const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, balance')
                    .order('balance', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setLeaderboard((data as unknown as Pick<Profile, 'username' | 'balance'>[]) || []);
            } catch (err: any) {
                setError('Failed to fetch leaderboard data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <div className="bg-[#1a1d3a] min-h-screen">
            <header className="bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-700/50">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                             <button onClick={onBack} aria-label="Back to lobby" className="text-gray-400 hover:text-white transition-colors">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <h1 className="text-xl font-bold text-white">Leaderboard</h1>
                        </div>
                         {profile && (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="font-bold text-white block text-sm">{profile.username}</span>
                                    <span className="text-xs text-yellow-400 font-semibold">{animatedBalance.toFixed(2)} EUR</span>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-center mb-8 text-white">Leaderboard</h1>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-16">Rank</th>
                                    <th scope="col" className="px-6 py-3">User</th>
                                    <th scope="col" className="px-6 py-3 text-right">Balance (EUR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center p-8"><SpinnerIcon className="w-8 h-8 mx-auto text-pink-400" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={3} className="text-center p-8 text-red-400">{error}</td></tr>
                                ) : leaderboard.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center p-8">No players on the leaderboard yet.</td></tr>
                                ) : (
                                    leaderboard.map((user, index) => (
                                        <tr key={user.username} className="bg-slate-800/30 border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="px-6 py-4 font-bold text-lg text-center">{index + 1}</td>
                                            <td className="px-6 py-4 font-semibold text-white">{user.username}</td>
                                            <td className="px-6 py-4 text-right font-mono text-yellow-400">{user.balance.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeaderboardPage;