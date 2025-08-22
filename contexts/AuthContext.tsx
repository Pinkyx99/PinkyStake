import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import type { Database } from '../lib/supabaseClient.ts';
import type { AuthContextType, Profile } from '../types.ts';
import SpinnerIcon from '../components/icons/SpinnerIcon.tsx';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'supabase-casino-profile';
const ALL_PROFILE_FIELDS = 'id, username, balance, created_at, banned_until, ban_reason, muted_until, warnings, level, rank, xp, godmode_until, is_admin, total_wagered, total_wins, total_losses';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    
    const isAdmin = useMemo(() => profile?.is_admin === true || profile?.username === 'Admin', [profile]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const savedProfileString = localStorage.getItem(PROFILE_STORAGE_KEY);
                if (savedProfileString) {
                    const savedProfile: Profile = JSON.parse(savedProfileString);
                    // Re-fetch latest data on load to ensure sync
                    const { data, error } = await supabase
                        .from('profiles')
                        .select(ALL_PROFILE_FIELDS)
                        .eq('id', savedProfile.id)
                        .single();
                    
                    if (error) {
                         console.warn("Couldn't re-sync profile, using local data.", error);
                         setProfile(savedProfile);
                    } else {
                        const loadedProfile = data as unknown as Profile | null;
                        if (loadedProfile?.banned_until && new Date(loadedProfile.banned_until) > new Date()) {
                            setProfile(null);
                            localStorage.removeItem(PROFILE_STORAGE_KEY);
                        } else {
                            setProfile(loadedProfile);
                            if (loadedProfile) {
                                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(loadedProfile));
                            } else {
                                localStorage.removeItem(PROFILE_STORAGE_KEY);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load profile from localStorage", error);
                localStorage.removeItem(PROFILE_STORAGE_KEY);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    useEffect(() => {
        // If we have a profile, set up a real-time listener for updates
        if (profile?.id) {
            const channel = supabase
                .channel(`public:profiles:id=eq.${profile.id}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
                    (payload) => {
                        const updatedProfile = payload.new as unknown as Profile;
                        setProfile(updatedProfile);
                        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
                    }
                )
                .subscribe();

            // Cleanup subscription on component unmount or profile change
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [profile?.id]);

    const login = useCallback(async (username: string, password: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select(ALL_PROFILE_FIELDS)
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            console.error('Login failed:', error);
            return { error: { message: 'Invalid username or password.' } };
        }

        const potentialProfile = data as unknown as Profile;

        if (potentialProfile.banned_until && new Date(potentialProfile.banned_until) > new Date()) {
            return { error: { message: `BANNED::${potentialProfile.banned_until}::${potentialProfile.ban_reason || 'No reason provided.'}` } };
        }

        setProfile(potentialProfile);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(potentialProfile));
        return { error: null };
    }, []);

    const signUp = useCallback(async (username: string, password: string) => {
        const { data: existingUser, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', username) // Case-insensitive check
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error('Error checking username:', fetchError);
            return { error: { message: 'An error occurred during signup.' } };
        }
        if (existingUser) {
            return { error: { message: 'Username is already taken.' } };
        }
        
        const payload = { 
            username, 
            password, 
            balance: 1000.00,
            level: 1,
            rank: 'Newbie',
            xp: 0,
            warnings: [],
            is_admin: false,
        };
        const { error: insertError } = await supabase.from('profiles').insert([payload]);

        if (insertError) {
            console.error('Signup failed:', insertError);
            return { error: { message: 'Could not create account.' } };
        }

        return { error: null };
    }, []);

    const signOut = useCallback(() => {
        setProfile(null);
        localStorage.removeItem(PROFILE_STORAGE_KEY);
    }, []);
    
    const adjustBalance = async (amount: number) => {
        if (!profile) return;

        const newBalance = profile.balance + amount;
        
        const oldProfile = profile;
        setProfile({...profile, balance: newBalance});
        
        const payload = { balance: newBalance };
        const { data, error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', profile.id)
            .select(ALL_PROFILE_FIELDS)
            .single();

        if (error) {
            console.error("Error adjusting balance:", error);
            setProfile(oldProfile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(oldProfile));
        } else if (data) {
            const updatedProfile = data as unknown as Profile;
            setProfile(updatedProfile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
        }
    };

    const value: AuthContextType = {
        profile,
        loading,
        isAdmin,
        login,
        signUp,
        signOut,
        adjustBalance,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                 <div className="flex items-center justify-center min-h-screen">
                    <SpinnerIcon className="w-12 h-12 text-pink-400" />
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};