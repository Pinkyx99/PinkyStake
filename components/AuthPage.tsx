import React, { useState, useEffect } from 'react';
import SpinnerIcon from './icons/SpinnerIcon.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

type AuthMode = 'login' | 'signup';

interface BanInfo {
    expires: string;
    reason: string;
}

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const { login, signUp } = useAuth();

    useEffect(() => {
        if (!banInfo) return;

        const interval = setInterval(() => {
            const now = new Date();
            const expires = new Date(banInfo.expires);
            const distance = expires.getTime() - now.getTime();

            if (distance < 0) {
                setTimeLeft('Expired - You can now log in.');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [banInfo]);

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setError(null);
        setUsername('');
        setPassword('');
        setSignupSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSignupSuccess(false);

        const trimmedUsername = username.trim();

        if (trimmedUsername.length < 3) {
            setError("Username must be at least 3 characters.");
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        if (mode === 'signup') {
            const { error: signUpError } = await signUp(trimmedUsername, password);
            if (signUpError) {
                setError(signUpError.message);
            } else {
                setSignupSuccess(true);
                setUsername('');
                setPassword('');
            }
        } else { // Login
            const { error: signInError } = await login(trimmedUsername, password);
            if (signInError) {
                if (signInError.message.startsWith('BANNED::')) {
                    const [, expires, reason] = signInError.message.split('::');
                    setBanInfo({ expires, reason });
                    setError(null);
                } else {
                    setError(signInError.message);
                }
            }
        }
        setLoading(false);
    };

    if (banInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md p-8 space-y-6 bg-red-900/50 rounded-2xl shadow-2xl border border-red-700/50 text-center">
                    <h1 className="text-4xl font-extrabold text-red-400">You Are Banned</h1>
                    <div className="text-left bg-slate-800 p-4 rounded-md space-y-2">
                        <p className="text-slate-400">Reason:</p>
                        <p className="text-white font-semibold">{banInfo.reason}</p>
                    </div>
                     <div className="text-left bg-slate-800 p-4 rounded-md space-y-2">
                        <p className="text-slate-400">Ban Expires In:</p>
                        <p className="text-yellow-400 font-bold text-2xl font-mono">{timeLeft}</p>
                    </div>
                    <button onClick={() => setBanInfo(null)} className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">
                        Back to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-sm p-8 space-y-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                      <span className="text-pink-400">Supabase</span>
                      <span className="text-white">Casino</span>
                    </h1>
                    <p className="mt-2 text-slate-400">{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {signupSuccess && (
                        <p className="text-sm text-center text-green-400">
                            Signup successful! You can now log in.
                        </p>
                    )}
                     {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                     
                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-slate-300">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed h-10"
                        >
                            {loading ? <SpinnerIcon className="w-5 h-5" /> : (mode === 'login' ? 'Login' : 'Sign Up')}
                        </button>
                    </div>
                </form>

                <p className="text-sm text-center text-slate-400">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button onClick={toggleMode} className="font-medium text-pink-400 hover:text-pink-300 ml-1">
                        {mode === 'login' ? 'Sign up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;