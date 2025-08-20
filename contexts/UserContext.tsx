import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Profile, BoxItem, InventoryItem, CSGOItem, CSGOInventoryItem } from '../types';

interface UserContextType {
  profile: Profile;
  adjustBalance: (amount: number) => void;
  setBalance: (amount: number) => void;
  updateUsername: (newUsername: string) => Promise<void>;
  redeemCode: (code: string) => Promise<{ success: boolean, message: string }>;
  addToInventory: (item: BoxItem) => void;
  sellFromInventory: (itemId: number) => void;
  addToCsgoInventory: (items: CSGOItem[]) => void;
  removeFromCsgoInventory: (instanceIds: string[]) => void;
  addItemsToCsgoInventory: (items: CSGOItem[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const PROMO_CODES: Record<string, number> = {
    'FREE5': 5,
    'PINKY10': 10,
    'LUCKY7': 7
};

const initialProfile: Profile = {
  username: 'Guest',
  balance: 1000.00,
  usedCodes: [],
  inventory: [],
  csgoInventory: [],
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const adjustBalance = useCallback((amount: number) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      balance: prevProfile.balance + amount,
    }));
  }, []);

  const setBalance = useCallback((amount: number) => {
    if (isNaN(amount) || amount < 0) {
        console.error("Invalid balance amount provided.");
        return;
    }
    setProfile(prevProfile => ({
      ...prevProfile,
      balance: amount,
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

  const redeemCode = useCallback(async (code: string): Promise<{ success: boolean, message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
    const upperCaseCode = code.toUpperCase();

    if (profile.usedCodes.includes(upperCaseCode)) {
        return { success: false, message: "You have already used this code." };
    }
    
    const amount = PROMO_CODES[upperCaseCode];
    if (amount) {
        setProfile(prev => ({
            ...prev,
            balance: prev.balance + amount,
            usedCodes: [...prev.usedCodes, upperCaseCode],
        }));
        return { success: true, message: `Success! ${amount.toFixed(2)} EUR has been added to your balance.` };
    }
    
    return { success: false, message: "Invalid or expired promocode." };
  }, [profile.usedCodes]);

  const addToInventory = useCallback((item: BoxItem) => {
    setProfile(prevProfile => {
        const newInventory = [...prevProfile.inventory];
        const existingItemIndex = newInventory.findIndex(invItem => invItem.id === item.id);
        
        if (existingItemIndex > -1) {
          newInventory[existingItemIndex] = {
            ...newInventory[existingItemIndex],
            quantity: newInventory[existingItemIndex].quantity + 1,
          };
        } else {
          newInventory.push({ ...item, quantity: 1 });
        }
        
        return {
          ...prevProfile,
          inventory: newInventory,
        };
      });
  }, []);

  const sellFromInventory = useCallback((itemId: number) => {
    setProfile(prevProfile => {
      let itemPrice = 0;
      const newInventory = prevProfile.inventory.map(item => {
        if (item.id === itemId) {
          itemPrice = item.price;
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove item if quantity becomes 0

      return {
        ...prevProfile,
        balance: prevProfile.balance + itemPrice,
        inventory: newInventory,
      };
    });
  }, []);

  const addToCsgoInventory = useCallback((items: CSGOItem[]) => {
      setProfile(prev => {
          const newItems: CSGOInventoryItem[] = items.map(item => ({
              ...item,
              instanceId: `${Date.now()}-${Math.random()}`
          }));
          return {
              ...prev,
              csgoInventory: [...prev.csgoInventory, ...newItems]
          };
      });
  }, []);

  const removeFromCsgoInventory = useCallback((instanceIds: string[]) => {
      setProfile(prev => ({
          ...prev,
          csgoInventory: prev.csgoInventory.filter(item => !instanceIds.includes(item.instanceId))
      }));
  }, []);

  const addItemsToCsgoInventory = useCallback((items: CSGOItem[]) => {
    const newInventoryItems: CSGOInventoryItem[] = items.map(item => ({
        ...item,
        instanceId: `${Date.now()}-${item.id}-${Math.random()}`
    }));
    setProfile(prev => ({
        ...prev,
        csgoInventory: [...prev.csgoInventory, ...newInventoryItems]
    }));
}, []);


  const value = {
    profile,
    adjustBalance,
    setBalance,
    updateUsername,
    redeemCode,
    addToInventory,
    sellFromInventory,
    addToCsgoInventory,
    removeFromCsgoInventory,
    addItemsToCsgoInventory,
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
      ...context,
      loading: false, 
      session: { user: { id: 'guest', email: 'guest@example.com' }}, // Mock session to prevent "Sign In" button
      signOut: async () => { console.log("Offline mode: sign out does nothing."); }
  };
};