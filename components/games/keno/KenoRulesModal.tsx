
import React, { useEffect } from 'react';
import CloseIcon from '../../icons/CloseIcon';

interface KenoRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KenoRulesModal: React.FC<KenoRulesModalProps> = ({ isOpen, onClose }) => {
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
            Keno is a game of chance, similar to the lottery and extremely popular amongst modern casinos, you to choose 0-10 numbers ranging from 1-40. After making your selection and placing your bets, 10 numbers are randomly drawn, and if you've picked correctly, you will receive your winnings based on the associated pay table.
          </p>
          <h3 className="text-3xl font-extrabold text-green-400 mt-6 tracking-widest uppercase">Have a lucky try!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>Coefficients that are in the center of the row are the lowest, you don't want to hit the ball on those ones</li>
            <li>The game has four risks — Classic, Low, Medium and High according to which you can change the coefficients themselves</li>
            <li>In the game of Keno, 10 numbers are randomly selected from a set of numbers ranging from 1 to 40. If any of these 10 numbers match the number chosen by the user, it is considered a win, and the corresponding coefficients are recorded.</li>
          </ul>
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>The amount of users winnings is equal to the coefficient corresponding to the number of green balls multiplied by the amount user bet.</li>
            <li>Coefficients increase as they get further away from the center (doesn't matter if it's a left or right side, they still increase)</li>
            <li>Malfunction Voids All Pays and Play</li>
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

export default KenoRulesModal;
