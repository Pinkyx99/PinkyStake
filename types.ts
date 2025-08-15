export interface Game {
  id: number;
  title: string;
  slug?: 'chicken' | 'blackjack' | 'doors' | 'dice' | 'roulette' | 'crash' | 'limbo' | 'keno' | 'wheel' | 'pump' | 'flip';
  imageUrl: string;
  color: 'orange' | 'purple' | 'green' | 'brown' | 'yellow' | 'teal' | 'pink' | 'blue' | 'cyan' | 'red';
}

export interface Profile {
  username: string;
  balance: number;
}