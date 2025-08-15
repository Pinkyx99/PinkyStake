
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile, Session } from '../types';
import { supabase } from '../lib/supabase';

interface UserContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  adjustBalance: (amount: number) => Promise<void>;
  updateUsername: (string: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // This function handles fetching an existing profile or creating a new one for a user.
  // It's wrapped in useCallback to prevent it from being recreated on every render.
  const getUserProfile = useCallback(async (user: User): Promise<Profile | null> => {
    // 1. Try to fetch the user's profile from the database.
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If an error occurs that ISN'T the "no rows found" error, it's a real problem.
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Database Error: Could not fetch user profile.", fetchError);
      return null;
    }

    // If a profile was found, return it.
    if (existingProfile) {
      return existingProfile;
    }

    // 2. If no profile was found, this is a new user. We need to create their profile.
    console.log("No profile found for new user, creating one...");
    const usernameFromMeta = user.user_metadata?.username;
    const newUsername = (typeof usernameFromMeta === 'string' && usernameFromMeta)
      ? usernameFromMeta
      : (user.email?.split('@')[0] || `user_${user.id.substring(0, 6)}`);
      
    const newProfileData = {
      id: user.id,
      username: newUsername,
      balance: 1000.00, // Generous starting balance for all new players!
    };

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([newProfileData])
      .select()
      .single();

    if (insertError) {
      console.error("Database Error: Could not create user profile.", insertError);
      return null;
    }
    
    console.log("Profile created successfully.");
    return newProfile;
  }, []);

  useEffect(() => {
    // This is the core authentication listener for the entire application.
    // It runs once on initial page load to check for an existing session,
    // and then continues to listen for any changes (e.g., user logs in or out).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          // Whenever the authentication state changes, we update our session and profile state.
          setSession(session);

          if (session?.user) {
            // If a user is logged in, fetch their profile data.
            const userProfile = await getUserProfile(session.user);
            setProfile(userProfile);
          } else {
            // If no user is logged in (e.g., after logout), clear the profile.
            setProfile(null);
          }
        } catch (e) {
          // This will catch any unexpected errors during the profile fetch/create process.
          console.error("An unexpected error occurred during auth state change:", e);
          setProfile(null);
          setSession(null);
        } finally {
          // CRITICAL: This ensures the main application's loading screen is always removed,
          // regardless of whether the user is logged in or an error occurred. This
          // is the definitive fix for the infinite loading screen.
          setLoading(false);
        }
      }
    );

    // When the UserProvider is unmounted, we clean up the auth listener to prevent memory leaks.
    return () => {
      subscription.unsubscribe();
    };
  }, [getUserProfile]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
    // The onAuthStateChange listener above will automatically handle clearing the session and profile.
  };
  
  const adjustBalance = useCallback(async (amount: number) => {
    if (!profile) {
      console.error("Cannot adjust balance: no user profile.");
      throw new Error("User must be logged in to adjust balance.");
    }
    
    const originalProfile = profile;
    const newBalance = originalProfile.balance + amount;

    // Optimistically update the UI for a smoother experience
    setProfile({ ...originalProfile, balance: newBalance });

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', originalProfile.id);
        
    if (error) {
      console.error("Error updating balance, rolling back UI:", error);
      // Rollback UI on database error
      setProfile(originalProfile);
      throw error;
    }
  }, [profile]);

  const updateUsername = useCallback(async (newUsername: string) => {
    if (!profile || !session) {
      throw new Error("User must be logged in to update username.");
    }

    const originalProfile = profile;
    setProfile({ ...originalProfile, username: newUsername });

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', originalProfile.id);
      
    if (profileError) {
      setProfile(originalProfile); // Rollback
      throw profileError;
    }

    const { error: userError } = await supabase.auth.updateUser({
      data: { username: newUsername }
    });

    if (userError) {
        // Rollback profile username if auth user update fails
        await supabase.from('profiles').update({ username: originalProfile.username }).eq('id', originalProfile.id);
        setProfile(originalProfile); // Rollback UI
        throw userError;
    }
  }, [profile, session]);

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
