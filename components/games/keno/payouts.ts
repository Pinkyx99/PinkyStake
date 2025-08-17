
export type RiskLevel = 'Low' | 'Medium' | 'High';

// Payout structure: PAYOUTS[riskLevel][numbersPicked][hits] = multiplier
export const PAYOUTS: Record<RiskLevel, Record<number, Record<number, number>>> = {
  Low: {
    1: { 1: 3.8 },
    2: { 1: 1.7, 2: 4.5 },
    3: { 2: 2, 3: 16 },
    4: { 2: 1.5, 3: 4, 4: 32 },
    5: { 3: 2, 4: 8, 5: 60 },
    6: { 3: 1.5, 4: 4, 5: 16, 6: 120 },
    7: { 3: 1.2, 4: 2, 5: 8, 6: 40, 7: 150 },
    8: { 4: 1.5, 5: 4, 6: 15, 7: 60, 8: 300 },
    9: { 4: 1.2, 5: 2, 6: 8, 7: 30, 8: 120, 9: 600 },
    10: { 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.8, 6: 3.5, 7: 13, 8: 50, 9: 250, 10: 1000 },
  },
  Medium: {
    1: { 1: 3.8 },
    2: { 2: 10 },
    3: { 2: 1.5, 3: 50 },
    4: { 2: 1, 3: 6, 4: 100 },
    5: { 3: 2, 4: 15, 5: 250 },
    6: { 3: 1.5, 4: 5, 5: 40, 6: 500 },
    7: { 4: 2, 5: 10, 6: 80, 7: 800 },
    8: { 4: 1.5, 5: 5, 6: 25, 7: 150, 8: 1000 },
    9: { 5: 2, 6: 10, 7: 50, 8: 250, 9: 1000 },
    10: { 3: 1.6, 4: 2, 5: 4, 6: 7, 7: 26, 8: 100, 9: 500, 10: 1000 },
  },
  High: {
    1: { 1: 3.8 },
    2: { 2: 15 },
    3: { 3: 100 },
    4: { 3: 4, 4: 200 },
    5: { 3: 2, 4: 20, 5: 500 },
    6: { 4: 4, 5: 50, 6: 800 },
    7: { 4: 2, 5: 15, 6: 100, 7: 1000 },
    8: { 5: 4, 6: 40, 7: 200, 8: 1000 },
    9: { 5: 2, 6: 10, 7: 80, 8: 400, 9: 1000 },
    10: { 4: 3.5, 5: 8, 6: 13, 7: 63, 8: 500, 9: 800, 10: 1000 },
  }
};

// Initialize all missing hit counts with a 0x multiplier
Object.values(PAYOUTS).forEach(riskLevel => {
    for (let picks = 1; picks <= 10; picks++) {
        if (riskLevel[picks]) {
            for (let hits = 0; hits <= picks; hits++) {
                if (riskLevel[picks][hits] === undefined) {
                    riskLevel[picks][hits] = 0;
                }
            }
        }
    }
});
