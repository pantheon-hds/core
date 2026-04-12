export type Vote = 'approved' | 'rejected' | null

export type VoteResult =
  | { finalised: false; tiebreak?: true }
  | { finalised: true; finalStatus: 'approved' | 'rejected' }

/**
 * Determines whether a set of judge votes has reached a final decision.
 * Mirrors the logic in supabase/functions/profile-action — keep in sync.
 *
 * 3 judges: early finalisation as soon as 2/3 agree
 * 2 judges: wait for both votes; 1-1 split signals tiebreak
 * Any other panel size: never auto-finalise
 */
export function resolveVotes(votes: Vote[]): VoteResult {
  const total = votes.length
  const voted = votes.filter(v => v !== null).length
  const approved = votes.filter(v => v === 'approved').length
  const rejected = votes.filter(v => v === 'rejected').length

  if (total === 3) {
    if (approved >= 2) return { finalised: true, finalStatus: 'approved' }
    if (rejected >= 2) return { finalised: true, finalStatus: 'rejected' }
    return { finalised: false }
  }

  if (total === 2) {
    if (voted < 2) return { finalised: false }
    if (approved === 2) return { finalised: true, finalStatus: 'approved' }
    if (rejected === 2) return { finalised: true, finalStatus: 'rejected' }
    return { finalised: false, tiebreak: true }
  }

  return { finalised: false }
}
