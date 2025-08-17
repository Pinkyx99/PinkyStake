export interface Game {
  id: number;
  title: string;
  slug?: 'chicken' | 'blackjack' | 'doors' | 'dice' | 'roulette' | 'crash' | 'limbo' | 'keno' | 'wheel' | 'pump' | 'flip' | 'mysterybox' | 'csgo';
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
}

export interface MysteryBox {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  items: BoxItem[];
}