export type Tier = 'Platinum' | 'Diamond' | 'Legend';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  tier: Tier;
  game: string;
  attempts: number;
  color: string;
}

export const eldenRingChallenges: Challenge[] = [
  {
    id: 1,
    title: 'Naked & Afraid',
    description: 'Complete the game wearing no armor. No chest, no helm, no legs, no gauntlets. Weapons and shields allowed.',
    tier: 'Platinum',
    game: 'Elden Ring',
    attempts: 1240,
    color: '#8ab4d4',
  },
  {
    id: 2,
    title: 'Flask Free',
    description: 'Defeat any 5 Great Enemies without using a single flask during the entire run. Crimson, Cerulean, and Wondrous Physick all count.',
    tier: 'Platinum',
    game: 'Elden Ring',
    attempts: 892,
    color: '#8ab4d4',
  },
  {
    id: 3,
    title: 'One And Done',
    description: 'Complete the game with only one weapon from start to finish. Same weapon must land the killing blow on final boss.',
    tier: 'Platinum',
    game: 'Elden Ring',
    attempts: 743,
    color: '#8ab4d4',
  },
  {
    id: 4,
    title: 'Speed of the Erdtree',
    description: 'Complete the game in under 3 hours from character creation to final boss death.',
    tier: 'Platinum',
    game: 'Elden Ring',
    attempts: 521,
    color: '#8ab4d4',
  },
  {
    id: 5,
    title: 'The Purist',
    description: 'Complete the game with no Ashes of War equipped on any weapon at any time. Default movesets only.',
    tier: 'Diamond',
    game: 'Elden Ring',
    attempts: 234,
    color: '#a8d4f4',
  },
  {
    id: 6,
    title: 'Level One Wretch',
    description: 'Defeat Malenia, Blade of Miquella at Soul Level 1. No summons. No co-op.',
    tier: 'Diamond',
    game: 'Elden Ring',
    attempts: 187,
    color: '#a8d4f4',
  },
  {
    id: 7,
    title: 'Ghost Run',
    description: 'Complete the game without killing any optional enemies. Only bosses required for progression may be killed.',
    tier: 'Diamond',
    game: 'Elden Ring',
    attempts: 98,
    color: '#a8d4f4',
  },
  {
    id: 8,
    title: 'Rune Ascetic',
    description: 'Complete the entire game without spending a single rune on leveling up. Runes may be used for purchasing items only.',
    tier: 'Diamond',
    game: 'Elden Ring',
    attempts: 156,
    color: '#a8d4f4',
  },
  {
    id: 9,
    title: 'True No Hit',
    description: 'Complete the game from start to final boss without taking a single hit. All main bosses required. No summons. No co-op. Full uncut stream required.',
    tier: 'Legend',
    game: 'Elden Ring',
    attempts: 12,
    color: '#c44a2a',
  },
  {
    id: 10,
    title: 'Blindfolded Margit',
    description: 'Defeat Margit, the Fell Omen completely blindfolded. Streamed live with camera showing the blindfold.',
    tier: 'Legend',
    game: 'Elden Ring',
    attempts: 7,
    color: '#c44a2a',
  },
];
