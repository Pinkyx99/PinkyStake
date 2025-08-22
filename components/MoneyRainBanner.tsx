import React, { useState, useEffect } from 'react';
import type { MoneyRain } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import SpinnerIcon from './icons/SpinnerIcon.tsx';

interface MoneyRainBannerProps {
    rain: MoneyRain;
    onClaimed: () => void;
}

const MoneyRainBanner: React.FC<MoneyRainBannerProps> = ({ rain, onClaimed }) => {
    const { adjustBalance } = useAuth();
    const [timeLeft, setTimeLeft] = useState(0);
    const [status, setStatus] = useState<'idle' | 'claiming' | 'claimed' | 'error' | 'expired'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const remaining = new Date(rain.expires_at).getTime() - Date.now();
            if (remaining <= 0) {
                setTimeLeft(0);
                if (status === 'idle') setStatus('expired');
            } else {
                setTimeLeft(remaining);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [rain, status]);

    const handleClaim = async () => {
        setStatus('claiming');
        const { data, error } = await supabase.rpc('claim_rain', { rain_id_to_claim: rain.id });

        if (error) {
            console.error('Claim error:', error);
            setStatus('error');
            setMessage('An error occurred.');
        } else if (data !== 'Rain claimed successfully!') {
            setStatus('error');
            setMessage(data);
        } else {
            setStatus('claimed');
            setMessage(`You claimed ${rain.amount.toFixed(2)} EUR!`);
            // The RPC function updates the balance, but we can optimistically update the context
            // The real-time listener in AuthContext will sync the true value shortly after.
            adjustBalance(rain.amount);
        }

        setTimeout(() => {
            onClaimed();
        }, 2000);
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60).toString().padStart(2, '0');
        const minutes = Math.floor(ms / (1000 * 60)).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="bg-yellow-500 text-black text-center p-2 flex items-center justify-center gap-4 relative z-[999] money-rain-banner">
            <p className="font-bold money-rain-text-glow">
                MONEY RAIN! 🌧️ Claim your share of {rain.amount.toFixed(2)} EUR!
            </p>
            <div className="flex items-center gap-4">
                {status === 'idle' && (
                    <>
                        <span className="font-mono text-sm bg-black/20 px-2 py-1 rounded">Expires in: {formatTime(timeLeft)}</span>
                        <button onClick={handleClaim} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md">
                            Claim
                        </button>
                    </>
                )}
                {status === 'claiming' && <SpinnerIcon className="w-6 h-6" />}
                {status === 'claimed' && <span className="font-bold text-green-800">{message}</span>}
                {(status === 'error' || status === 'expired') && <span className="font-bold text-red-800">{status === 'expired' ? 'Rain has expired!' : message}</span>}
            </div>
        </div>
    );
};

export default MoneyRainBanner;