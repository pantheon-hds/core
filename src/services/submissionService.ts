import { supabase } from './supabase';
import { challengeTierToRankTier, getRankOrder } from '../constants/ranks';
import type { ChallengeTier } from '../constants/ranks';

export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface VoteResult extends ServiceResult {
  finalised: boolean;
}

// How many approved challenges of a given tier are needed to advance from each rank.
// Unranked users are treated the same as Bronze.
const RANK_PROGRESSION: Record<string, { challengeTier: string; required: number; nextRank: string }> = {
  'Bronze I':    { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' },
  'Bronze II':   { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' },
  'Bronze III':  { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' },
  'Silver I':    { challengeTier: 'Platinum', required: 4, nextRank: 'Platinum' },
  'Silver II':   { challengeTier: 'Platinum', required: 4, nextRank: 'Platinum' },
  'Silver III':  { challengeTier: 'Platinum', required: 4, nextRank: 'Platinum' },
  'Gold':        { challengeTier: 'Platinum', required: 3, nextRank: 'Platinum' },
  'Platinum':    { challengeTier: 'Diamond',  required: 2, nextRank: 'Diamond'  },
  'Diamond':     { challengeTier: 'Master',   required: 2, nextRank: 'Master'   },
  'Master':      { challengeTier: 'Grandmaster', required: 1, nextRank: 'Grandmaster' },
};
const UNRANKED_PROGRESSION = { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' };

// Awards a rank + statue to a user after a challenge submission is approved.
// Rank is only awarded when the user has enough approved challenges to advance.
// Statue always updates to reflect the latest approved challenge tier.
// Note: admin-action Edge Function contains its own equivalent for the admin review path.
export async function awardRankForChallenge(
  userId: string,
  challengeId: number
): Promise<ServiceResult> {
  const { data: challenge } = await supabase
    .from('challenges')
    .select('game_id, title, tier')
    .eq('id', challengeId)
    .single();

  if (!challenge) return { success: false, error: 'Challenge not found' };

  const rankTier = challengeTierToRankTier(challenge.tier as ChallengeTier);

  // Always update statue to show the latest approved challenge
  const { error: statueError } = await supabase.from('statues').upsert(
    {
      user_id: userId,
      game_id: challenge.game_id,
      tier: rankTier,
      challenge: challenge.title,
      is_unique: challenge.tier === 'Legend',
    },
    { onConflict: 'user_id,game_id' }
  );
  if (statueError) return { success: false, error: statueError.message };

  // Get user's current rank for this game
  const { data: currentRank } = await supabase
    .from('ranks')
    .select('tier, method')
    .eq('user_id', userId)
    .eq('game_id', challenge.game_id)
    .maybeSingle();

  const currentTier = currentRank?.tier ?? null;
  const req = currentTier ? RANK_PROGRESSION[currentTier] : UNRANKED_PROGRESSION;

  // Grandmaster+ has no further progression path
  if (!req) return { success: true };

  // This challenge tier doesn't contribute to the current progression path
  if (challenge.tier !== req.challengeTier) return { success: true };

  // Count approved submissions for challenges of the required tier in this game
  const { data: tierChallenges } = await supabase
    .from('challenges')
    .select('id')
    .eq('game_id', challenge.game_id)
    .eq('tier', req.challengeTier);

  const tierChallengeIds = tierChallenges?.map(c => c.id) ?? [];
  if (tierChallengeIds.length === 0) return { success: true };

  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved')
    .in('challenge_id', tierChallengeIds);

  // Not enough approved challenges yet
  if ((count ?? 0) < req.required) return { success: true };

  // Don't downgrade a community_verified rank that's already higher
  if (currentRank?.method === 'community_verified' && currentTier) {
    if (getRankOrder(req.nextRank) >= getRankOrder(currentTier)) return { success: true };
  }

  const { error: rankError } = await supabase.from('ranks').upsert(
    { user_id: userId, game_id: challenge.game_id, tier: req.nextRank, method: 'community_verified' },
    { onConflict: 'user_id,game_id' }
  );
  if (rankError) return { success: false, error: rankError.message };

  return { success: true };
}

// Judge path: record a vote via Edge Function (handles 2/3 majority logic server-side).
export async function recordJudgeVote(
  assignmentId: string,
  submissionId: string,
  vote: 'approved' | 'rejected',
  timestampNote: string,
  token: string
): Promise<VoteResult> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/profile-action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'record-judge-vote', assignmentId, submissionId, vote, timestampNote }),
    });
    const result = await res.json();
    if (!result.success) return { success: false, error: result.error, finalised: false };
    return { success: true, finalised: result.finalised ?? false };
  } catch (err) {
    return { success: false, error: (err as Error).message, finalised: false };
  }
}
