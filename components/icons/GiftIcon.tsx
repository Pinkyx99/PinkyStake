import React from 'react';

const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A3.375 3.375 0 006.375 8.25H17.625A3.375 3.375 0 0012 4.875z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.875c-1.25-1.033-2.5-1.033-3.75 0S6.375 6.442 6.375 8.25H12m0-3.375c1.25-1.033 2.5-1.033 3.75 0S17.625 6.442 17.625 8.25H12M3.375 8.25c0 1.39.297 2.7.83 3.938" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.625 8.25c0 1.39-.297 2.7-.83 3.938" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.188v9.312" />
  </svg>
);

export default GiftIcon;
