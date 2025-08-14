
import React, { useEffect, useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import TrophyIcon from './icons/TrophyIcon';
import { supabase } from '../lib/supabase';
import SpinnerIcon from './icons/SpinnerIcon';

interface LeaderboardProps {
  onClose: () => void;
}

interface Player {
  rank: number;
  username: string;
  winnings: number;
  color: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, balance')
        .order('balance', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Could not load leaderboard data.');
      } else if (data) {
        setPlayers(data.map((p, i) => ({
          rank: i + 1,
          username: p.username,
          winnings: p.balance,
          color: i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-400',
        })));
      }
      setLoading(false);
    };

    fetchLeaderboard();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center font-poppins"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-900/80 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: 'translateZ(0)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-400" />
            <h2 className="text-3xl font-bold text-white tracking-wider">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close leaderboard"
          >
            <CloseIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <SpinnerIcon className="w-12 h-12 text-purple-400" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full text-red-400">
              {error}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900/80">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="p-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="p-3 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Winnings (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.rank} className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-lg">
                      <span className={player.color}>{player.rank}</span>
                    </td>
                    <td className="p-4 font-semibold text-white">{player.username}</td>
                    <td className="p-4 font-semibold text-green-400 text-right">
                      {player.winnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;