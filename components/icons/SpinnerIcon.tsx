
import React from 'react';

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `}</style>
    <path
      className="opacity-25"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
    <path
      className="animate-spin"
      fill="currentColor"
      d="M12 20.012A8.012 8.012 0 014 12H0c0 6.627 5.373 12 12 12v-3.988z"
    />
  </svg>
);

export default SpinnerIcon;
