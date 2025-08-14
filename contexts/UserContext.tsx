
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { type Profile, type Session } from '../types';
import { supabase } from '../lib/supabase';
import { type User } from '@supabase/supabase-js';

interface UserContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  adjustBalance: (amount: number) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User | undefined) => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') { // Profile doesn't exist, create it
          const newProfile = {
            id: user.id,
            username: (user.user_metadata.username as string) || user.email?.split('@')[0] || `user_${user.id.substring(0, 6)}`,
            balance: 1000.00,
          };
          const { error: insertError } = await supabase.from('profiles').insert(newProfile);
          if (insertError) {
             console.error('Error creating profile:', insertError);
          } else {
            setProfile(newProfile);
          }
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error('An unexpected error occurred while fetching profile:', e);
    }
  }, []);
  
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await fetchProfile(session?.user);
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      await fetchProfile(session?.user);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };
  
  const adjustBalance = useCallback(async (amount: number) => {
    const currentProfile = profileRef.current;
    if (!currentProfile) {
      throw new Error("User must be logged in to adjust balance.");
    }
    
    const newBalance = currentProfile.balance + amount;
    
    setProfile(p => p ? { ...p, balance: newBalance } : null);

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', currentProfile.id);
      
    if (error) {
      console.error("Error updating balance:", error);
      setProfile(currentProfile); // Revert on error
      throw error;
    }
  }, []);

  const updateUsername = useCallback(async (newUsername: string) => {
    const currentProfile = profileRef.current;
    if (!currentProfile) {
      throw new Error("User must be logged in to update username.");
    }

    // Update public profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', currentProfile.id);
      
    if (profileError) throw profileError;

    // Update Supabase Auth user_metadata
     const { data: { user }, error: userError } = await supabase.auth.updateUser({
      data: { username: newUsername }
    });

    if (userError) {
        // Revert profile change if auth update fails
        await supabase
          .from('profiles')
          .update({ username: currentProfile.username })
          .eq('id', currentProfile.id);
        throw userError;
    }
    
    setProfile(p => p ? { ...p, username: newUsername } : null);
  }, []);

  const value = {
    session,
    profile,
    loading,
    signOut,
    adjustBalance,
    updateUsername,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
