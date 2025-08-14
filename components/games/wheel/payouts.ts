
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type SegmentCount = 10 | 20 | 30 | 40 | 50;

export const MULTIPLIER_COLORS: Record<number, string> = {
    0:     '#4b5563', // Gray
    1.2:   '#f1f5f9', // White
    1.5:   '#84cc16', // Lime Green
    1.7:   '#f1f5f9', // White
    2:     '#facc15', // Yellow
    3:     '#a855f7', // Purple
    4:     '#f97316', // Orange
    5:     '#ec4899', // Pink
    9.9:   '#ef4444', // Red
    10:    '#d946ef', // Fuchsia
    19.8:  '#ef4444', // Red
    20:    '#a855f7', // Purple
    29.7:  '#ef4444', // Red
    30:    '#8b5cf6', // Violet
    39.6:  '#ef4444', // Red
    49.5:  '#ef4444', // Red
};


type SegmentConfig = Record<RiskLevel, Record<SegmentCount, number[]>>;

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateSegments = (config: Record<number, number>, total: number): number[] => {
    const segments: number[] = [];
    for (const multiplier in config) {
        const count = config[multiplier];
        for (let i = 0; i < count; i++) {
            segments.push(parseFloat(multiplier));
        }
    }
    // Safety check in case config doesn't add up to total
    while (segments.length < total) segments.push(0);
    return shuffle(segments.slice(0, total));
};

export const SEGMENT_CONFIG: SegmentConfig = {
    Low: {
        10: generateSegments({ 0: 2, 1.2: 7, 1.5: 1 }, 10),
        20: generateSegments({ 0: 4, 1.2: 14, 1.5: 2 }, 20),
        30: generateSegments({ 0: 6, 1.2: 21, 1.5: 3 }, 30),
        40: generateSegments({ 0: 8, 1.2: 28, 1.5: 4 }, 40),
        50: generateSegments({ 0: 10, 1.2: 35, 1.5: 5 }, 50),
    },
    Medium: {
        10: generateSegments({ 0: 5, 1.5: 2, 2: 2, 4: 1 }, 10),
        20: generateSegments({ 0: 10, 1.5: 4, 1.7: 1, 2: 4, 3: 1 }, 20),
        30: generateSegments({ 0: 15, 1.5: 6, 1.7: 1, 2: 6, 3: 1, 4: 1 }, 30),
        40: generateSegments({ 0: 20, 1.5: 8, 1.7: 2, 2: 8, 3: 1, 4: 1 }, 40),
        50: generateSegments({ 0: 25, 1.5: 10, 1.7: 2, 2: 10, 3: 2, 4: 1 }, 50),
    },
    High: {
        10: generateSegments({ 0: 9, 9.9: 1 }, 10),
        20: generateSegments({ 0: 19, 19.8: 1 }, 20),
        30: generateSegments({ 0: 29, 29.7: 1 }, 30),
        40: generateSegments({ 0: 39, 39.6: 1 }, 40),
        50: generateSegments({ 0: 49, 49.5: 1 }, 50),
    },
};
