import type { Session } from '@supabase/supabase-js';
import { type Database } from './lib/database.types';

export interface Game {
  id: number;
  title: string;
  slug?: 'chicken' | 'blackjack' | 'doors' | 'dice' | 'roulette' | 'crash' | 'limbo' | 'keno' | 'wheel';
  imageUrl: string;
  color: 'orange' | 'purple' | 'green' | 'brown' | 'yellow' | 'teal' | 'pink' | 'blue' | 'cyan' | 'red';
}

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type { Session };