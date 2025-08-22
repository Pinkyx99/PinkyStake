
import React, { useEffect } from 'react';
import CloseIcon from '../../icons/CloseIcon';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tableData = {
  headers: ['10', '9', '8', '7', '6', '5', '4', '3', '2'],
  rows: {
    low:    ['1', '1', '1', '1', '1', '1', '1', '1', '1'],
    medium: ['3', '3', '3', '3', '2', '2', '2', '1', '1'],
    high:   ['5', '5', '4', '4', '3', '3', '2', '2', '1'],
  },
};

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-poppins"
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
          <p className="mt-4 text-gray-400">
            Doors is a new engaging mini game. In this game, you have to open mysterious doors. Each opened door means a win.
          </p>
          <h3 className="text-3xl font-extrabold text-green-400 mt-6 tracking-widest">HAVE A LUCKY TRY!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>There are 10 doors</li>
            <li>If the door is locked and it won't open you'll lose your bet</li>
            <li>Increased risks means the increased initial multiplier, as a result, you will win more on each opened door</li>
            <li>Malfunction Voids All Pays and Play</li>
          </ul>
           <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>On each opened door, you get a win, which is equal to the bet amount multiplied by the initial multiplier</li>
            <li>You can choose between 3 game risks – Low, Medium, High</li>
            <li>Play for fun and win big</li>
          </ul>
        </div>

        <div className="mt-8">
            <h4 className="font-semibold text-white mb-2">doors_loosing_doors_count</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-sm">
                    <thead>
                        <tr className="bg-[#2f324d]/50">
                            <th className="p-2 border border-slate-600 font-normal">common_game_risk</th>
                            {tableData.headers.map(header => (
                                <th key={header} className="p-2 border border-slate-600 font-normal">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-2 border border-slate-600 text-left text-yellow-300 font-semibold">common_risk_low</td>
                            {tableData.rows.low.map((val, i) => <td key={i} className="p-2 border border-slate-600 text-yellow-300 font-semibold">{val}</td>)}
                        </tr>
                         <tr>
                            <td className="p-2 border border-slate-600 text-left text-yellow-300 font-semibold">common_risk_medium</td>
                            {tableData.rows.medium.map((val, i) => <td key={i} className="p-2 border border-slate-600 text-yellow-300 font-semibold">{val}</td>)}
                        </tr>
                         <tr>
                            <td className="p-2 border border-slate-600 text-left text-yellow-300 font-semibold">common_risk_high</td>
                            {tableData.rows.high.map((val, i) => <td key={i} className="p-2 border border-slate-600 text-yellow-300 font-semibold">{val}</td>)}
                        </tr>
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
    </div>
  );
};

export default GameRulesModal;