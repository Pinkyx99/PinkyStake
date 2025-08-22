

import React from 'react';
import CloseIcon from '../../icons/CloseIcon.tsx';

const PumpRulesModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-poppins"
      onClick={onClose}
    >
      <div
        className="bg-[#21243e] w-full max-w-2xl rounded-lg shadow-2xl p-8 text-gray-300 relative border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><CloseIcon className="w-8 h-8" /></button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-wider text-white uppercase">Pump Game Rules</h2>
          <h3 className="text-3xl font-extrabold text-red-400 mt-6 tracking-widest uppercase">Don't let it pop!</h3>
        </div>
        <div className="space-y-4 text-sm">
          <p>Pump is a game of nerve and timing. The goal is to inflate the balloon as much as possible to increase your winnings, but cash out before it pops!</p>
          <ul className="space-y-3 list-disc list-inside">
            <li><b>Set Your Bet:</b> Adjust your bet amount and choose a difficulty level before you start.</li>
            <li><b>Start Pumping:</b> The first press of the "Pump" button will place your bet and start the game.</li>
            <li><b>Increase Multiplier:</b> Each subsequent press of "Pump" inflates the balloon and increases the payout multiplier.</li>
            <li><b>Risk of Popping:</b> With every pump, the chance of the balloon popping increases. Higher difficulty means a higher risk!</li>
            <li><b>Cash Out:</b> Click "Cashout" at any time after the first pump to collect your winnings based on the current multiplier.</li>
            <li><b>Bust:</b> If the balloon pops, your bet is lost and the round is over.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PumpRulesModal;