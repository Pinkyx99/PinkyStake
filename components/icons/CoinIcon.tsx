import React from 'react';

const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.093c-1.72.223-3.094 1.5-3.094 3.157 0 1.657 1.373 3 3.094 3.157v.093a.75.75 0 001.5 0v-.093c1.72-.223 3.094-1.5 3.094-3.157 0-1.657-1.373-3-3.094-3.157V6zM12 15a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

export default CoinIcon;
