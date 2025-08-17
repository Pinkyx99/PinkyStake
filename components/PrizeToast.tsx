import React from 'react';

interface PrizeToastProps {
  message: string;
  amount: number;
}

const PrizeToast: React.FC<PrizeToastProps> = ({ message, amount }) => {
  return (
    <div className="prize-toast-container">
      <div className="prize-toast-content">
        <p className="text-lg font-semibold text-white">{message}</p>
        <p className="text-4xl font-bold text-yellow-300 text-glow-purple">
          +${amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default PrizeToast;