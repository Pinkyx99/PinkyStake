
import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import SpinnerIcon from './icons/SpinnerIcon';

type AuthMode = 'login' | 'signup';

const Auth: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setError(null);
        setUsername('');
        setPassword('');
    };

    // Firebase Auth requires an email. We create a dummy one.
    const getDummyEmail = (uname: string) => `${uname.toLowerCase()}@pinkystake.local`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        const email = getDummyEmail(username);

        try {
            if (mode === 'signup') {
                // Create a new user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create a user document in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    id: user.uid,
                    username: username,
                    balance: 1000.00,
                    total_wagered: 0,
                    total_wins: 0,
                    total_losses: 0,
                    inventory: [],
                    csgoInventory: [],
                    usedCodes: [],
                    created_at: new Date().toISOString(),
                });
            } else {
                // Sign in the user with email and password
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            // Handle Firebase authentication errors
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('This username is already taken.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid username or password.');
                    break;
                default:
                    setError('An error occurred. Please try again.');
                    console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-sm p-8 space-y-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                      <span style={{textShadow: '0 0 8px rgba(236, 72, 153, 0.6)'}} className="text-pink-400">Pinky</span>
                      <span className="text-white">Stake</span>
                    </h1>
                    <p className="mt-2 text-slate-400">{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
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

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Auth;
