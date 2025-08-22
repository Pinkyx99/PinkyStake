
import React, { useEffect } from 'react';
import CloseIcon from '../../icons/CloseIcon';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const payTableData = [
    { name: 'Number (Straight Up)', value: '35 to 1' },
    { name: 'Split (2 numbers)', value: '17 to 1' },
    { name: 'Street (3 numbers)', value: '11 to 1' },
    { name: 'Corner (4 numbers)', value: '8 to 1' },
    { name: 'Six Line (6 numbers)', value: '5 to 1' },
    { name: 'Column (12 numbers)', value: '2 to 1' },
    { name: 'Dozen (12 numbers)', value: '2 to 1' },
    { name: 'Odd/Even', value: '1 to 1' },
    { name: 'Red/Black', value: '1 to 1' },
    { name: '1-18 / 19-36', value: '1 to 1' },
];


const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-poppins animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div 
        className="bg-[#21243e] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl p-8 text-gray-300 relative border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close game rules"
        >
          <CloseIcon className="w-8 h-8" />
        </button>

        <div className="text-center mb-6">
          <h2 id="rules-title" className="text-2xl font-bold tracking-wider text-white">GET A SUPER EXCITING EXPERIENCE WITH CHANCES OF ALL OR NOTHING!</h2>
          <p className="mt-2 text-gray-400">
            It's easy to play and fun for people taking risks!
          </p>
          <h3 className="text-3xl font-extrabold text-green-400 mt-6 tracking-widest">HAVE A LUCKY TRY!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>Place bets on the roulette table to predict where the ball will land on the roulette wheel.</li>
            <li>Place bets on the betting table at any time before the spin starts. Each betting option has a minimum and maximum chip placement amount specified.</li>
            <li>The winning bet corresponds to the pocket where the ball comes to rest on the Roulette wheel.</li>
            <li>After the winning bets are determined, collect your winnings.</li>
            <li>Go step back with the selected bet using Undo</li>
            <li>Repeat the bet with Rebet</li>
            <li>Erase all bets with Clear</li>
          </ul>
           <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>Bet on specific numbers, red or black colors, even or odd numbers, rows, splits, corners, or twelves.</li>
            <li>Click the bet button to spin the Roulette wheel and determine the winning number.</li>
            <li>Payouts are based on the type of bet placed, with higher odds resulting in higher payouts.</li>
            <li>Each place has different minimum and maximum limits for chip placement</li>
            <li>If a player places a chip/bet on an outside bet (Red/Black, Odd/Even, 1 to 18/19 to 36) and the ball lands on zero, no wins can be offered as it is considered a straight-up bet</li>
            <li>Malfunctions void all pays and plays</li>
          </ul>
        </div>

        <div className="mt-8">
            <h4 className="font-semibold text-white mb-2 text-center text-lg">Payouts</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-[#2f324d]/50">
                            <th className="p-3 border-b-2 border-slate-600 font-semibold">Bet Type</th>
                            <th className="p-3 border-b-2 border-slate-600 font-semibold text-right">Pays</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payTableData.map((item, index) => (
                           <tr key={index} className="border-b border-slate-700">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-right font-mono text-yellow-300">{item.value}</td>
                           </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="mt-8">
            <h4 className="font-semibold text-white mb-2">Limits:</h4>
            <table className="w-full text-center border-collapse text-sm">
                 <thead>
                    <tr className="bg-[#2f324d]/50">
                        <th className="p-2 border border-slate-600 font-normal">Currency</th>
                        <th className="p-2 border border-slate-600 font-normal">Min Bet</th>
                        <th className="p-2 border border-slate-600 font-normal">Max Bet</th>
                        <th className="p-2 border border-slate-600 font-normal">Max profit cap</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="p-2 border border-slate-600 text-yellow-300 font-semibold">EUR</td>
                        <td className="p-2 border border-slate-600 text-yellow-300 font-semibold">0.20</td>
                        <td className="p-2 border border-slate-600 text-yellow-300 font-semibold">1000.00</td>
                        <td className="p-2 border border-slate-600 text-yellow-300 font-semibold">10000.00</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className="mt-8">
            <ul className="list-disc list-inside text-sm">
                <li>(Return to Player) offered: 99%</li>
            </ul>
        </div>

      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default GameRulesModal;