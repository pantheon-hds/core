// Single source of truth for all rank tier strings, colors, and ordering.
// Import from here — never hardcode rank strings elsewhere.

export const RANK_TIERS = [
  'Legend',
  'Grandmaster',
  'Master I',
  'Diamond I',
  'Platinum I',
  'Gold',
  'Silver III',
  'Silver II',
  'Silver I',
  'Bronze III',
  'Bronze II',
  'Bronze I',
] as const;

export type RankTier = typeof RANK_TIERS[number];

// Tiers used in the Admin form and stored in the challenges table
export const CHALLENGE_TIERS = [
  'Platinum',
  'Diamond',
  'Master',
  'Grandmaster',
  'Legend',
] as const;

export type ChallengeTier = typeof CHALLENGE_TIERS[number];

// These tiers do NOT get ' I' appended when converted to a rank tier
const SINGLETON_TIERS: readonly ChallengeTier[] = ['Grandmaster', 'Legend'];

// Converts a challenge tier (e.g. 'Platinum') to the rank tier stored in DB (e.g. 'Platinum I')
export function challengeTierToRankTier(challengeTier: ChallengeTier): RankTier {
  if (SINGLETON_TIERS.includes(challengeTier)) {
    return challengeTier as RankTier;
  }
  return `${challengeTier} I` as RankTier;
}

// Returns the sort index of a rank (lower = higher rank). Unknown tiers return Infinity.
export function getRankOrder(tier: string): number {
  const idx = (RANK_TIERS as readonly string[]).indexOf(tier);
  return idx === -1 ? Infinity : idx;
}

// Colors for challenge tier labels (Platinum, Diamond, Master, etc.)
export const TIER_COLORS: Record<string, string> = {
  Platinum:    '#9ac4e4',
  Diamond:     '#b8e4ff',
  Master:      '#d4a8f4',
  Grandmaster: '#f4d4a8',
  Legend:      '#e45a3a',
};

// Colors for full rank tier strings (Gold, Silver III, Platinum I, etc.)
export const RANK_TIER_COLORS: Record<string, string> = {
  Gold:          '#e8a830',
  'Silver III':  '#d8eaf8',
  'Silver II':   '#d8eaf8',
  'Silver I':    '#d8eaf8',
  'Bronze III':  '#e8974a',
  'Bronze II':   '#e8974a',
  'Bronze I':    '#e8974a',
  'Platinum I':  '#9ac4e4',
  'Diamond I':   '#b8e4ff',
  'Master I':    '#d4a8f4',
  Grandmaster:   '#f4d4a8',
  Legend:        '#e45a3a',
};

export interface TierColorSet {
  primary: string;
  secondary: string;
  base: string;
}

// Full color sets used by the statue SVG renderer
export const TIER_COLOR_SETS: Record<string, TierColorSet> = {
  'Bronze I':   { primary: '#e8974a', secondary: '#a06030', base: '#3a2215' },
  'Bronze II':  { primary: '#e8974a', secondary: '#a06030', base: '#3a2215' },
  'Bronze III': { primary: '#e8974a', secondary: '#a06030', base: '#3a2215' },
  'Silver I':   { primary: '#d8eaf8', secondary: '#8898a8', base: '#2a3040' },
  'Silver II':  { primary: '#d8eaf8', secondary: '#8898a8', base: '#2a3040' },
  'Silver III': { primary: '#d8eaf8', secondary: '#8898a8', base: '#2a3040' },
  Gold:         { primary: '#e8a830', secondary: '#b07820', base: '#3a2e1a' },
  'Platinum I': { primary: '#8ab4d4', secondary: '#6a94b4', base: '#1e2a3a' },
  'Diamond I':  { primary: '#a8d4f4', secondary: '#78b4e4', base: '#182030' },
  'Master I':   { primary: '#d4a8f4', secondary: '#b080e4', base: '#221430' },
  Grandmaster:  { primary: '#f4d4a8', secondary: '#c4a478', base: '#2a1e0a' },
  Legend:       { primary: '#c44a2a', secondary: '#a43a1a', base: '#2a1a0a' },
};

export function getTierColorSet(tier: string): TierColorSet {
  if (tier.startsWith('Gold')) return TIER_COLOR_SETS['Gold'];
  if (tier.startsWith('Silver')) return TIER_COLOR_SETS['Silver I'];
  if (tier.startsWith('Bronze')) return TIER_COLOR_SETS['Bronze I'];
  return TIER_COLOR_SETS[tier] ?? TIER_COLOR_SETS['Bronze I'];
}
