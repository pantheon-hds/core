import type { RankTier } from '../constants/ranks';

// Determine rank based on achievement percentage.
// Must stay in sync with getTier() in supabase/functions/check-achievements/index.ts
export function determineRank(percentage: number): RankTier | null {
  if (percentage === 100) return 'Gold';
  if (percentage >= 95) return 'Silver III';
  if (percentage >= 90) return 'Silver II';
  if (percentage >= 75) return 'Silver I';
  if (percentage >= 50) return 'Bronze III';
  if (percentage >= 25) return 'Bronze II';
  if (percentage >= 1)  return 'Bronze I';
  return null; // 0% — no rank granted
}
