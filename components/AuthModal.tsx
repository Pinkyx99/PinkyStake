
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import CloseIcon from './icons/CloseIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const email = `${username.trim().toLowerCase()}@minigames.local`;

    try {
      if (view === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });
        if (error) throw error;
        setMessage('Success! You can now sign in with your new account.');
        setView('sign_in');
      } else { // sign_in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      if (err.message && err.message.includes("User already registered")) {
        setError("Username is already taken. Please try a different one or sign in.");
      } else {
        setError(err.error_description || err.message || 'An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center font-poppins" onClick={onClose}>
      <div className="bg-slate-900/80 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            {view === 'sign_in' ? 'Sign In' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <CloseIcon className="w-7 h-7" />
          </button>
        </div>
        
        {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4 text-sm">{error}</p>}
        {message && <p className="bg-green-500/20 text-green-300 p-3 rounded-md mb-4 text-sm">{message}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-3 bg-slate-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-slate-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-wait flex items-center justify-center"
          >
            {loading ? <SpinnerIcon className="w-6 h-6" /> : (view === 'sign_in' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm">
          {view === 'sign_in' ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setView(view === 'sign_in' ? 'sign_up' : 'sign_in'); setError(null); setMessage(null); }} className="ml-2 font-semibold text-purple-400 hover:text-purple-300">
            {view === 'sign_in' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
