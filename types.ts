
import { type Session } from '@supabase/supabase-js';

export interface Game {
  id: number;
  title: string;
  slug?: 'chicken' | 'blackjack' | 'doors' | 'dice' | 'roulette' | 'crash' | 'limbo' | 'keno' | 'wheel';
  imageUrl: string;
  color: 'orange' | 'purple' | 'green' | 'brown' | 'yellow' | 'teal' | 'pink' | 'blue' | 'cyan' | 'red';
}

export interface Profile {
  id: string;
  username: string;
  balance: number;
}

export { Session };
