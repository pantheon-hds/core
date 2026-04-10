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

// Judge path: record a vote and finalise the submission if all judges have voted.
export async function recordJudgeVote(
  assignmentId: string,
  submissionId: string,
  vote: 'approved' | 'rejected',
  timestampNote: string
): Promise<VoteResult> {
  const { error: voteError } = await supabase
    .from('submission_judges')
    .update({ vote, timestamp_note: timestampNote, voted_at: new Date().toISOString() })
    .eq('id', assignmentId);

  if (voteError) return { success: false, error: voteError.message, finalised: false };

  // Check if all judges have now voted
  const { data: allVotes } = await supabase
    .from('submission_judges')
    .select('vote')
    .eq('submission_id', submissionId);

  if (!allVotes) return { success: true, finalised: false };

  const totalVoted = allVotes.filter(v => v.vote !== null).length;
  const totalJudges = allVotes.length;

  if (totalVoted < totalJudges) return { success: true, finalised: false };

  const approvedVotes = allVotes.filter(v => v.vote === 'approved').length;
  const finalStatus = approvedVotes >= Math.ceil(totalJudges / 2) ? 'approved' : 'rejected';

  // Guard against race condition: only process if we're the one to change the status
  const { data: updated } = await supabase
    .from('submissions')
    .update({ status: finalStatus })
    .eq('id', submissionId)
    .in('status', ['pending', 'in_review'])
    .select('id, user_id, challenge_id');

  if (!updated || updated.length === 0) {
    // Another judge already finalised this submission
    return { success: true, finalised: false };
  }

  if (finalStatus === 'approved') {
    const sub = updated[0];
    if (!sub.user_id || !sub.challenge_id) return { success: true, finalised: true };
    const awardResult = await awardRankForChallenge(sub.user_id, sub.challenge_id);
    if (!awardResult.success) return { ...awardResult, finalised: true };
  }

  return { success: true, finalised: true };
}
