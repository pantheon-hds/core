import { supabase } from './supabase';

export interface PantheonEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  steamId: string;
  bestTier: string;
  bestGame: string;
  statueCount: number;
  uniqueStatueCount: number;
}

const TIER_ORDER = [
  'Legend', 'Grandmaster', 'Master',
  'Diamond', 'Platinum',
  'Gold', 'Silver III', 'Silver II', 'Silver I',
  'Bronze III', 'Bronze II', 'Bronze I',
];

export async function getPantheonData(): Promise<PantheonEntry[]> {
  const { data: ranks, error } = await supabase
    .from('ranks')
    .select('user_id, tier, game:games(title), user:users(id, username, avatar_url, steam_id)')
    .order('granted_at', { ascending: true });

  if (error || !ranks) return [];

  const { data: statues } = await supabase
    .from('statues')
    .select('user_id, is_unique');

  type StatueCount = { user_id: string; is_unique: boolean | null };
  type PantheonRankRow = {
    user_id: string;
    tier: string;
    game: { title: string } | null;
    user: { id: string; username: string; avatar_url: string | null; steam_id: string } | null;
  };

  const statueCounts: Record<string, { total: number; unique: number }> = {};
  ((statues || []) as StatueCount[]).forEach(s => {
    if (!statueCounts[s.user_id]) statueCounts[s.user_id] = { total: 0, unique: 0 };
    statueCounts[s.user_id].total++;
    if (s.is_unique) statueCounts[s.user_id].unique++;
  });

  const byUser: Record<string, PantheonEntry> = {};

  (ranks as PantheonRankRow[]).forEach(r => {
    const user = r.user;
    if (!user) return;
    const existing = byUser[user.id];
    const currentOrder = TIER_ORDER.indexOf(r.tier);
    const existingOrder = existing ? TIER_ORDER.indexOf(existing.bestTier) : Infinity;
    if (!existing || currentOrder < existingOrder) {
      const counts = statueCounts[user.id] || { total: 0, unique: 0 };
      byUser[user.id] = {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        steamId: user.steam_id,
        bestTier: r.tier,
        bestGame: r.game?.title || '—',
        statueCount: counts.total,
        uniqueStatueCount: counts.unique,
      };
    }
  });

  return Object.values(byUser).sort((a, b) => {
    const ai = TIER_ORDER.indexOf(a.bestTier);
    const bi = TIER_ORDER.indexOf(b.bestTier);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
