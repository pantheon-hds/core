import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import type { UserRank, UserStatue, JudgeEligibility } from '../types';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Re-export types so existing imports from this file keep working
export type { UserRank, UserStatue };

export async function getUserRanks(userId: string): Promise<UserRank[]> {
  const { data, error } = await supabase
    .from('ranks')
    .select('id, tier, method, granted_at, game:games(id, title, steam_app_id)')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) { console.error('Error fetching ranks:', error); return []; }
  return (data as UserRank[]) || [];
}

export async function getUserStatues(userId: string): Promise<UserStatue[]> {
  const { data, error } = await supabase
    .from('statues')
    .select('id, tier, challenge, is_unique, granted_at, game:games(title)')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) { console.error('Error fetching statues:', error); return []; }
  return (data as UserStatue[]) || [];
}

export async function getUserBySteamId(steamId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('steam_id', steamId)
    .single();

  if (error) { console.error('Error fetching user:', error); return null; }
  return data;
}

export async function checkAchievements(steamId: string, appId: string) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check-achievements`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ steamId, appId }),
    }
  );
  if (!response.ok) return null;
  return response.json();
}

export async function checkJudgeEligibility(userId: string): Promise<JudgeEligibility> {
  const { data: platinumRank } = await supabase
    .from('ranks')
    .select('id')
    .eq('user_id', userId)
    .eq('tier', 'Platinum')
    .limit(1);

  const { data: user } = await supabase
    .from('users')
    .select('created_at, is_judge')
    .eq('id', userId)
    .single();

  const accountAge = user?.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const { data: existingApp } = await supabase
    .from('judge_applications')
    .select('id, status')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })
    .limit(1);

  return {
    hasPlatinumRank: (platinumRank?.length || 0) > 0,
    accountAgeOk: accountAge >= 7,
    isAlreadyJudge: user?.is_judge || false,
    existingApplication: existingApp?.[0] || null,
    meetsRequirements: (platinumRank?.length || 0) > 0 && accountAge >= 7,
  };
}

export async function submitJudgeApplication(
  userId: string,
  gameId: number,
  motivation: string
) {
  const { error } = await supabase.from('judge_applications').insert({
    user_id: userId,
    game_id: gameId,
    motivation,
    status: 'pending',
  });
  return !error;
}

export const REAPPLY_DAYS = 30;

export async function submitWaitlist(email: string, reason: string): Promise<{ success: boolean; error?: string }> {
  // Check if email already exists
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id, status, rejected_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    if (existing.status === 'pending') {
      return { success: false, error: 'This email is already on the waitlist.' };
    }
    if (existing.status === 'approved') {
      return { success: false, error: 'This email has already been approved. Check your inbox for the invite code.' };
    }
    if (existing.status === 'rejected') {
      const rejectedAt = existing.rejected_at ? new Date(existing.rejected_at) : new Date(0);
      const daysSince = (Date.now() - rejectedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < REAPPLY_DAYS) {
        const reapplyDate = new Date(rejectedAt.getTime() + REAPPLY_DAYS * 24 * 60 * 60 * 1000);
        const dateStr = reapplyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return { success: false, error: `You can reapply after ${dateStr}.` };
      }
      // 30 days passed — reset to pending
      const { error } = await supabase
        .from('waitlist')
        .update({ status: 'pending', reason: reason.trim() || null, rejection_reason: null, rejected_at: null, applied_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  }

  const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase(), reason: reason.trim() || null });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function validateInviteCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_invite_code', { p_code: code.trim().toUpperCase() });
  if (error) { console.error('Error validating invite code:', error); return false; }
  return data === true;
}

export async function sendInvite(waitlistId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-invite`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ waitlistId, email }),
    }
  );
  if (!response.ok) {
    const data = await response.json();
    return { success: false, error: data.error || 'Failed to send invite' };
  }
  return { success: true };
}

export async function rejectWaitlistEntry(id: string, rejectionReason: string): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-rejection`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ waitlistId: id, rejectionReason }),
    }
  );
  return response.ok;
}

export async function assignJudges(submissionId: string): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/assign-judges`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submissionId }),
    }
  );
  return response.ok;
}

export interface PublicProfileData {
  username: string;
  avatarUrl: string | null;
  steamId: string;
  createdAt: string;
  ranks: { tier: string; gameTitle: string; grantedAt: string }[];
  statues: { id: string; tier: string; gameTitle: string; isUnique: boolean; grantedAt: string }[];
}

export async function getPublicProfile(username: string): Promise<PublicProfileData | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, steam_id, created_at')
    .eq('username', username)
    .single();

  if (error || !user) return null;

  const [{ data: ranks }, { data: statues }] = await Promise.all([
    supabase
      .from('ranks')
      .select('tier, granted_at, game:games(title)')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false }),
    supabase
      .from('statues')
      .select('id, tier, is_unique, granted_at, game:games(title)')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false }),
  ]);

  type RankRow = { tier: string; granted_at: string; game: { title: string } | null };
  type StatueRow = { id: string; tier: string; is_unique: boolean | null; granted_at: string; game: { title: string } | null };

  return {
    username: user.username,
    avatarUrl: user.avatar_url,
    steamId: user.steam_id,
    createdAt: user.created_at ?? '',
    ranks: ((ranks as RankRow[]) || []).map(r => ({
      tier: r.tier,
      gameTitle: r.game?.title ?? '—',
      grantedAt: r.granted_at,
    })),
    statues: ((statues as StatueRow[]) || []).map(s => ({
      id: s.id,
      tier: s.tier,
      gameTitle: s.game?.title ?? '—',
      isUnique: s.is_unique ?? false,
      grantedAt: s.granted_at,
    })),
  };
}

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

  const TIER_ORDER = [
    'Legend', 'Grandmaster', 'Master',
    'Diamond', 'Platinum',
    'Gold', 'Silver III', 'Silver II', 'Silver I',
    'Bronze III', 'Bronze II', 'Bronze I',
  ];

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
