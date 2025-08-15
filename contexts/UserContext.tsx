import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Profile } from '../types';

interface UserContextType {
  profile: Profile;
  adjustBalance: (amount: number) => void;
  updateUsername: (newUsername: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialProfile: Profile = {
  username: 'Guest',
  balance: 1000.00,
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const adjustBalance = useCallback((amount: number) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      balance: prevProfile.balance + amount,
    }));
  }, []);
  
  const updateUsername = useCallback(async (newUsername: string) => {
    // Simulate async operation for local state update
    await new Promise(resolve => setTimeout(resolve, 300));
    setProfile(prevProfile => ({
      ...prevProfile,
      username: newUsername,
    }));
  }, []);

  const value = {
    profile,
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
  // Return a compatible structure for components that expect more fields
  return { 
      profile: context.profile, 
      adjustBalance: context.adjustBalance, 
      updateUsername: context.updateUsername,
      loading: false, 
      session: { user: { id: 'guest', email: 'guest@example.com' }}, // Mock session to prevent "Sign In" button
      signOut: async () => { console.log("Offline mode: sign out does nothing."); }
  };
};