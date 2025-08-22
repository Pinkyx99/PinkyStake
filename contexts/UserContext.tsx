import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import type { BoxItem, CSGOItem } from '../types.ts';

// This is now a compatibility layer to avoid refactoring all game components at once.
// It maps the new AuthContext to the old UserContext API.
export const useUser = () => {
  const { profile, loading, signOut, adjustBalance } = useAuth();
  
  // Create a user object that matches the old AppUser structure for compatibility.
  const user = profile ? {
      ...profile,
      total_wagered: 0,
      total_wins: 0,
      total_losses: 0,
      inventory: [],
      csgoInventory: [],
      usedCodes: [],
  } : null;

  // Stubbing inventory functions as they are out of scope for the 'single profiles table' requirement.
  // This prevents crashes in components that use them.
  const dummyPromise = async (): Promise<void> => {
      console.warn("Inventory function is not implemented in this version.");
  };
  const dummyRedeemPromise = async (): Promise<{ success: boolean; message: string; }> => {
      console.warn("Redeem code function is not implemented in this version.");
      return { success: false, message: "Promo codes are not available." };
  }

  return {
    user,
    profile, // Providing both for gradual refactoring
    stats: null,
    notifications: [],
    loading,
    signOut,
    adjustBalance,
    addToInventory: (item: BoxItem) => dummyPromise(),
    sellFromInventory: (itemId: number) => dummyPromise(),
    addToCsgoInventory: (items: CSGOItem[]) => dummyPromise(),
    removeFromCsgoInventory: (instanceIds: string[]) => dummyPromise(),
    redeemCode: (code: string) => dummyRedeemPromise(),
  };
};

// The UserProvider is no longer responsible for state management.
// AuthProvider is the single source of truth. This component is kept
// only to make the `useUser` hook available.
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <>{children}</>;
};