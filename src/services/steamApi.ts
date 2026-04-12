import type { RankTier } from '../constants/ranks';

export async function getSteamProfile(steamId: string) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/steam-profile?steamId=${steamId}`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Steam profile error:', error);
    return null;
  }
}

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
