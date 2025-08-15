
import React from 'react';
import CloseIcon from '../../icons/CloseIcon';

const FlipRulesModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
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
          <h2 className="text-2xl font-bold tracking-wider text-white uppercase">Coin Flip Rules</h2>
          <h3 className="text-3xl font-extrabold text-yellow-400 mt-6 tracking-widest uppercase">Heads or Tails?</h3>
        </div>
        <div className="space-y-4 text-sm">
          <p>A classic game of chance with a modern twist. Guess the outcome of the coin flip to multiply your winnings!</p>
          <ul className="space-y-3 list-disc list-inside">
            <li><b>Set Your Bet:</b> Choose the amount you want to wager on the flip.</li>
            <li><b>Pick a Side:</b> Select either "Heads" or "Tails".</li>
            <li><b>Bet:</b> Click the "Bet" button to start the coin flip.</li>
            <li><b>Win:</b> If the coin lands on your chosen side, your bet is multiplied by 2x!</li>
            <li><b>Flip Again or Cash Out:</b> After a win, you have a choice: click "Flip Again" to risk your current winnings for another 2x multiplier, or click "Cashout" to secure your profit.</li>
            <li><b>Lose:</b> If the coin does not land on your chosen side, the round is over and your wager is lost.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FlipRulesModal;
