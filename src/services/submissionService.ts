import { supabase } from './supabase';
import { challengeTierToRankTier } from '../constants/ranks';
import type { ChallengeTier } from '../constants/ranks';

export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface VoteResult extends ServiceResult {
  finalised: boolean;
}

// Awards a rank + statue to a user after a challenge submission is approved.
// Single source of truth for the rank-award side-effect — used by both
// adminReviewSubmission and recordJudgeVote.
export async function awardRankForChallenge(
  userId: string,
  challengeId: string
): Promise<ServiceResult> {
  const { data: challenge } = await supabase
    .from('challenges')
    .select('game_id, title, tier')
    .eq('id', challengeId)
    .single();

  if (!challenge) return { success: false, error: 'Challenge not found' };

  const rankTier = challengeTierToRankTier(challenge.tier as ChallengeTier);

  const { error: rankError } = await supabase.from('ranks').upsert(
    { user_id: userId, game_id: challenge.game_id, tier: rankTier, method: 'community_verified' },
    { onConflict: 'user_id,game_id' }
  );
  if (rankError) return { success: false, error: rankError.message };

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

  return { success: true };
}

// Admin path: directly approve or reject a submission.
export async function adminReviewSubmission(
  submissionId: string,
  action: 'approved' | 'rejected',
  adminNote: string
): Promise<ServiceResult> {
  const { error: updateError } = await supabase
    .from('submissions')
    .update({ status: action, admin_note: adminNote })
    .eq('id', submissionId);

  if (updateError) return { success: false, error: updateError.message };

  if (action === 'approved') {
    const { data: sub } = await supabase
      .from('submissions')
      .select('user_id, challenge_id')
      .eq('id', submissionId)
      .single();

    if (!sub) return { success: false, error: 'Submission not found after update' };

    return awardRankForChallenge(sub.user_id, sub.challenge_id);
  }

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
    const awardResult = await awardRankForChallenge(sub.user_id, sub.challenge_id);
    if (!awardResult.success) return { ...awardResult, finalised: true };
  }

  return { success: true, finalised: true };
}

// Approve or reject a judge application.
export async function reviewJudgeApplication(
  applicationId: string,
  userId: string,
  action: 'approved' | 'rejected'
): Promise<ServiceResult> {
  const { error: appError } = await supabase
    .from('judge_applications')
    .update({ status: action })
    .eq('id', applicationId);

  if (appError) return { success: false, error: appError.message };

  if (action === 'approved') {
    const { error: userError } = await supabase
      .from('users')
      .update({ is_judge: true })
      .eq('id', userId);

    if (userError) return { success: false, error: userError.message };
  }

  return { success: true };
}

// Appoint a user as judge by Steam ID.
export async function appointJudgeBySteamId(
  steamId: string
): Promise<ServiceResult & { username?: string }> {
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, username')
    .eq('steam_id', steamId)
    .single();

  if (!targetUser) {
    return { success: false, error: 'User not found. They must be registered on Pantheon first.' };
  }

  const { error } = await supabase
    .from('users')
    .update({ is_judge: true })
    .eq('id', targetUser.id);

  if (error) return { success: false, error: error.message };

  return { success: true, username: targetUser.username };
}
