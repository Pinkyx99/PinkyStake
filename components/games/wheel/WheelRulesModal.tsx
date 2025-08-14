
import React, { useEffect } from 'react';
import CloseIcon from '../../icons/CloseIcon';

interface WheelRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WheelRulesModal: React.FC<WheelRulesModalProps> = ({ isOpen, onClose }) => {
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
          <h3 className="text-3xl font-extrabold text-green-400 mt-6 tracking-widest uppercase">Have a lucky try!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>Well, the rules are simple. There is a wheel in front of you, which you can design according to your preferences. For example, you can divide the wheel into segments from 10 to 50 and select the risk level of the game.</li>
            <li>You can choose between the three types of risks – low, medium, and high. If the risk is low, you have a higher chance of winning, but if you win on medium or high risks, the amount of the win can be much more significant.</li>
            <li>The amount of users winnings is equal to the wheel-given coefficient multiplied by the amount user bet.</li>
            <li>The profit is calculated as follows: the user's bet multiplied by the wheel result segment multiplier.</li>
            <li>Each multiplier has a unique color, and the chance of getting a multiplier is displayed by dividing the number of segments with that color by the total number of segments on the wheel.</li>
            <li>Malfunction Voids All Pays and Play.</li>
          </ul>
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>The minimum coefficient of the win is 1.20x, while the maximum equals to 49.50x.</li>
            <li>The coefficients in between are defined by the risk level and the number of segments you choose.</li>
            <li>Try your luck and enjoy it!</li>
            <li>Please be aware that any malfunctions during gameplay will result in the voiding of all winnings and bets.</li>
            <li>Try your luck and enjoy it!</li>
            <li>The wheel result is generated randomly.</li>
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

export default WheelRulesModal;
