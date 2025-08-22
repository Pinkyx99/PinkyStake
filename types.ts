export interface Profile {
  id: string;
  username: string;
  balance: number;
  created_at: string;
  banned_until?: string | null;
  ban_reason?: string | null;
  muted_until?: string | null;
  warnings?: string[] | null;
  level?: number;
  rank?: string;
  xp?: number;
  godmode_until?: string | null;
  is_admin?: boolean;
  total_wagered?: number;
  total_wins?: number;
  total_losses?: number;
}

export interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (username: string, password: string) => Promise<{ error: { message: string } | null }>;
  login: (username: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => void;
  adjustBalance: (amount: number) => Promise<void>;
}

// Global Chat
export interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  username: string;
  profile?: Pick<Profile, 'is_admin'> // Include any other fields you want to join
}

// Notifications
export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: 'payment_received' | 'money_rain' | 'info' | 'warning';
  content: {
    sender?: string;
    amount?: number;
    message?: string;
  };
  is_read: boolean;
}

// Money Rain
export interface MoneyRain {
    id: string;
    created_at: string;
    amount: number;
    expires_at: string;
}

// Game Lobby
export interface Game {
  id: string;
  title: string;
  imageUrl: string;
  path: string;
}

// Mystery Box Items
export interface BoxItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  odds: number;
  groupId?: string;
}

export interface MysteryBox {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  items: BoxItem[];
}

// CSGO Items
export type CSGOItemRarity = 'Consumer' | 'Industrial' | 'Mil-Spec' | 'Restricted' | 'Classified' | 'Covert' | 'Extraordinary' | 'Contraband';
export type CSGOItemCondition = 'FN' | 'MW' | 'FT' | 'WW' | 'BS' | 'N/A';

export interface CSGOItem {
  id: string;
  weapon: string;
  skin: string;
  rarity: CSGOItemRarity;
  condition: CSGOItemCondition;
  statTrak: boolean;
  price: number;
  imageUrl: string;
  odds: number;
  groupId?: string;
}

export interface CSGOCase {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  items: CSGOItem[];
}


// User-specific types
export interface InventoryItem extends BoxItem {
  quantity: number;
}

export interface CSGOInventoryItem extends CSGOItem {
  instanceId: string;
}

export interface AppUser {
  id: string;
  username: string;
  balance: number;
  total_wagered: number;
  total_wins: number;
  total_losses: number;
  inventory: InventoryItem[];
  csgoInventory: CSGOInventoryItem[];
  usedCodes: string[];
  created_at: string;
}

export interface Stats {
  games_played: number;
  total_wagered: number;
  net_profit: number;
}

// CSGO Battles
export interface CSGOBattlePlayer {
  id: string;
  name: string;
  avatarUrl: string;
  isBot: boolean;
  items: CSGOItem[];
  totalValue: number;
}

export interface CSGOBattle {
  id: string;
  cases: CSGOCase[];
  playerCount: 2 | 3 | 4;
  isReverseMode: boolean;
  status: 'waiting' | 'live' | 'finished';
  players: (CSGOBattlePlayer | null)[];
  cost: number;
  winnerId?: string;
}