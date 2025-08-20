
export interface Game {
  id: number;
  title: string;
  slug?: 'chicken' | 'blackjack' | 'doors' | 'dice' | 'roulette' | 'crash' | 'limbo' | 'keno' | 'wheel' | 'flip' | 'mysterybox' | 'csgo' | 'mines';
  imageUrl: string;
  color: 'orange' | 'purple' | 'green' | 'brown' | 'yellow' | 'teal' | 'pink' | 'blue' | 'cyan' | 'red';
}

export interface BoxItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  odds: number;
}

export interface InventoryItem extends BoxItem {
  quantity: number;
}

export interface Profile {
  username: string;
  balance: number;
  usedCodes: string[];
  inventory: InventoryItem[];
  csgoInventory: CSGOInventoryItem[];
}

export interface MysteryBox {
  id: string;
  name:string;
  price: number;
  imageUrl: string;
  items: BoxItem[];
}

// CSGO Specific Types
export type CSGOItemRarity =
  | 'Consumer' // White
  | 'Industrial' // Light Blue
  | 'Mil-Spec' // Blue
  | 'Restricted' // Purple
  | 'Classified' // Pink
  | 'Covert' // Red
  | 'Contraband' // Orange
  | 'Extraordinary'; // Gold (Gloves, Knives)

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
  odds: number; // For case opening logic
  groupId?: string; // To group variants of the same item
}

export interface CSGOInventoryItem extends CSGOItem {
  instanceId: string;
}

export interface CSGOCase {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  items: CSGOItem[];
  category: 'Official' | 'Creators' | 'New' | 'Event';
}

// CSGO Case Battles Types
export interface CSGOBattlePlayer {
  id: string; // 'user' or bot id
  name: string;
  avatarUrl: string;
  isBot: boolean;
  items: CSGOItem[];
  totalValue: number;
}

export interface CSGOBattle {
  id: string;
  cases: CSGOCase[];
  players: (CSGOBattlePlayer | null)[]; // Array of players or empty slots
  playerCount: number;
  isReverseMode: boolean;
  status: 'waiting' | 'live' | 'finished';
  cost: number;
  winnerId?: string;
}
