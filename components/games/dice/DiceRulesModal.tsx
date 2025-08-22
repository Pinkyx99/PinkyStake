
import React, { useEffect } from 'react';
import CloseIcon from '../../icons/CloseIcon';

interface DiceRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DiceRulesModal: React.FC<DiceRulesModalProps> = ({ isOpen, onClose }) => {
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
            Dice is a game of chance where you can try your luck and find out how fortunate you are.
          </p>
          <h3 className="text-3xl font-extrabold text-green-400 mt-6 tracking-widest">HAVE A LUCKY TRY!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>The game has two visual modes that are simply visualizations of choosing a roll-over or roll-under number. In the history view, you can see bet details in line style mode.</li>
            <li>In this game, the dice is rolling on the surface, which is marked with numbers (from 0 to 100).</li>
            <li>You can set the marker at your desired number and push the play button.</li>
            <li>The user can pick a number from 2 to 98, regardless of the game mode (roll-over or roll-under).</li>
            <li>A random number is drawn from 0 to 100. If the number falls within the range chosen by the user, it is considered a win.</li>
          </ul>
          <ul className="space-y-3 list-disc list-inside text-gray-300">
            <li>If you set the marker on the lower number, you have the higher chance of winning.</li>
            <li>On the other hand, in case of placing the marker on the higher number (75 per say), the chance to win is lower but the profits are higher if the dice hits on the high number.</li>
            <li>That's why we call it the game of chance or luck where you can risk, dare and win big!</li>
            <li>As the name implies, if players are in Roll Over mode, the aim is for the dice to hit the value higher than the Roll Over amount. For Roll Under it is vice versa - the game aims to roll a winning number lower than the Roll Under amount.</li>
            <li>Players can see their expected profit on a winning Dice roll with the game interface based on their betting amount and how high the multiplier applies on a win based on the volatility set by the Roll Over/Roll Under target.</li>
            <li>With a virtual 100-side dice to roll, players can set the Roll Over/Roll Under amount which acts as a target for players to hit and win a round - controlling the Multiplier and Win Chance during a virtual roll of the dice in a betting round.</li>
            <li>Malfunction Voids All Pays and Play.</li>
          </ul>
        </div>

        <div className="mt-8 text-sm space-y-3">
            <p>When the game is in roll-over mode, the multiplier is calculated as follows: <span className="font-mono text-yellow-300">100 divided by (100 - roll-over number) and multiplied by RTP.</span></p>
            <p>When the game is in roll-under mode, the multiplier is calculated as follows: <span className="font-mono text-yellow-300">100 divided by roll-under number and multiplied by RTP.</span></p>
            <p>Win amount calculates as follows: <span className="font-mono text-yellow-300">multiplier multiplied by bet amount</span></p>
            <p>The amount of users winnings is equal to the multiplier multiplied by the amount user bet.</p>
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

      </div>
    </div>
  );
};

export default DiceRulesModal;