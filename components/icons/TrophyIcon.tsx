
import React from 'react';

const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75c-.622 0-1.125.504-1.125 1.125V18.75m9 0h-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21.75h4.5m-4.5 0a3 3 0 01-3-3V11.25a3 3 0 013-3h4.5a3 3 0 013 3v7.5a3 3 0 01-3 3m-4.5 0h4.5M12 11.25v-3.75M12 3.75a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
  </svg>
);

export default TrophyIcon;
