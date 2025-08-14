import React from 'react';

const DoubleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {/* Card in the back */}
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M5.25 7.5h6.375a2.625 2.625 0 012.625 2.625v9.75a2.625 2.625 0 01-2.625 2.625H5.25A2.625 2.625 0 012.625 19.875v-9.75A2.625 2.625 0 015.25 7.5z" 
    />
    {/* Card in the front */}
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M9.75 4.5h6.375a2.625 2.625 0 012.625 2.625v9.75a2.625 2.625 0 01-2.625 2.625H9.75A2.625 2.625 0 017.125 16.875v-9.75A2.625 2.625 0 019.75 4.5z" 
    />
  </svg>
);

export default DoubleIcon;