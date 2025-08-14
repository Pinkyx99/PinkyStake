
import React, { useEffect } from 'react';
import CloseIcon from '../../icons/CloseIcon';

interface LimboRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LimboRulesModal: React.FC<LimboRulesModalProps> = ({ isOpen, onClose }) => {
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
          <h2 id="rules-title" className="text-2xl font-bold tracking-wider text-white uppercase">Get a super exciting experience with chances of all or nothing!</h2>
          <p className="mt-2 text-gray-400">
            It's easy to play and fun for people taking risks!
          </p>
          <p className="mt-4 text-gray-400">
            Limbo is a game of chance that has been created for you by Upgaming. In this simple and funny game, you have to figure out how fortunate you are. So, try your luck, take a risk and have fun with it.
          </p>
          <h3 className="text-3xl font-extrabold text-green-400 mt-6 tracking-widest uppercase">Have a lucky try!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>In this game, you have to place a multiplier at a certain point and place a bet on the probability that the number that will appear on the screen will be higher than the designated multiplier.</li>
            <li>The minimum quantity at which you can place the multiplier is 1.01, while the maximum number you can mark for it is 10 000.</li>
            <li>The amount of users winnings is equal to the multiplier multiplied by the amount user bet</li>
            <li>The limbo result is generated randomly</li>
            <li>The profit is calculated as follows: if the chosen multiplier is greater than the number that appears on the screen, the profit is equal to the user's bet multiplied by the chosen multiplier.</li>
          </ul>
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>If the chosen multiplier is higher than the number that will appear on the screen, then you are a winner, but if it's not, then you'll lose your bet.</li>
            <li>The multiplier can be any number within the range of 1.01 to 10.000. The winning chance is calculated as follows: (Game RTP / multiplier) * 100</li>
            <li>Please be aware that any malfunctions during gameplay will result in the voiding of all winnings and bets.</li>
          </ul>
        </div>

        <div className="mt-8">
            <h4 className="font-semibold text-white mb-2">Limits:</h4>
            <div className="overflow-x-auto">
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
                            <td className="p-2 border border-slate-600 font-semibold">EUR</td>
                            <td className="p-2 border border-slate-600 font-semibold">0.20</td>
                            <td className="p-2 border border-slate-600 font-semibold">1000.00</td>
                            <td className="p-2 border border-slate-600 font-semibold">10000.00</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div className="mt-8">
            <ul className="list-disc list-inside text-sm">
                <li>RTP (Return to Player) offered: 99%</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default LimboRulesModal;
