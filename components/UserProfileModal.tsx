import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { Profile } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import CloseIcon from './icons/CloseIcon.tsx';
import SpinnerIcon from './icons/SpinnerIcon.tsx';

interface UserProfileModalProps {
    userProfile: Profile;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userProfile, onClose }) => {
    const { profile: selfProfile } = useAuth();
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSendPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0 || !selfProfile || selfProfile.balance < amount) {
            setPaymentStatus({ type: 'error', message: 'Invalid or insufficient amount.' });
            return;
        }
        setIsPaying(true);
        setPaymentStatus(null);
        
        const { data, error } = await supabase.rpc('transfer_balance', {
            recipient_id: userProfile.id,
            transfer_amount: amount,
        });

        if (error) {
            setPaymentStatus({ type: 'error', message: 'Transfer failed. Please try again.' });
            console.error("Transfer error:", error);
        } else if (data !== 'Transfer successful.') {
             setPaymentStatus({ type: 'error', message: data });
        }
        else {
            setPaymentStatus({ type: 'success', message: `Successfully sent ${amount.toFixed(2)} EUR!` });
            setPaymentAmount('');
        }
        
        setIsPaying(false);
        setTimeout(() => setPaymentStatus(null), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[1050] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl p-6 text-white profile-modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{userProfile.username}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="profile-stat-grid mb-6">
                    <div className="profile-stat">
                        <p className="profile-stat-label">Total Wagered</p>
                        <p className="profile-stat-value">€{(userProfile.total_wagered ?? 0).toFixed(2)}</p>
                    </div>
                     <div className="profile-stat">
                        <p className="profile-stat-label">Member Since</p>
                        <p className="profile-stat-value">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                {selfProfile?.id !== userProfile.id && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Send Money</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="Amount in EUR"
                                className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min="0.01"
                                step="0.01"
                            />
                            <button
                                onClick={handleSendPayment}
                                disabled={isPaying || !paymentAmount}
                                className="w-24 h-10 flex justify-center items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-bold text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                {isPaying ? <SpinnerIcon className="w-5 h-5"/> : 'Send'}
                            </button>
                        </div>
                        {paymentStatus && (
                             <p className={`text-sm mt-2 ${paymentStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {paymentStatus.message}
                             </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;