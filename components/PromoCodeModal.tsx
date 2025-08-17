import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import SpinnerIcon from './icons/SpinnerIcon';

const AVAILABLE_CODES = [
    { code: 'FREE5', description: 'Get 5.00 EUR for free!' },
    { code: 'PINKY10', description: 'Get 10.00 EUR bonus!' },
    { code: 'LUCKY7', description: 'Feeling lucky? Get 7.00 EUR!' }
];

const PromoCodeSection: React.FC = () => {
    const { profile, redeemCode } = useUser();
    const [inputCode, setInputCode] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCode.trim()) return;
        setLoading(true);
        setMessage(null);

        const result = await redeemCode(inputCode.trim().toUpperCase());
        
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
            setInputCode('');
        }
        
        setLoading(false);
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Available Codes</h3>
                <div className="space-y-2">
                    {AVAILABLE_CODES.map(c => (
                        <div key={c.code} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                            <p className="text-gray-300">{c.description}</p>
                            <span className="font-mono bg-slate-700 px-2 py-1 rounded text-yellow-300">{c.code}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <form onSubmit={handleRedeem}>
                <label htmlFor="promo-input" className="text-sm font-semibold text-gray-400 mb-1 block">Enter Code</label>
                <div className="flex items-center gap-2">
                    <input
                        id="promo-input"
                        type="text"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value)}
                        placeholder="e.g. FREE5"
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-bold text-white flex items-center disabled:bg-slate-600 disabled:cursor-not-allowed h-10">
                        {loading ? <SpinnerIcon className="w-5 h-5"/> : 'Redeem'}
                    </button>
                </div>
            </form>
            
            {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>
            )}

            <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Used Codes</h3>
                {profile.usedCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {profile.usedCodes.map(code => (
                            <span key={code} className="font-mono bg-slate-700 px-2 py-1 rounded text-gray-400 line-through">{code}</span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">You haven't used any codes yet.</p>
                )}
            </div>
        </div>
    );
};

export default PromoCodeSection;