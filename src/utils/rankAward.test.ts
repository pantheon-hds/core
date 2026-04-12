/**
 * Specification tests for rank award decisions.
 * Mirrors the logic in supabase/migrations/20260413000002_award_rank_function.sql.
 * If the PostgreSQL function changes, update these tests too.
 */
import { describe, it, expect } from 'vitest'
import { getProgressInfo } from './rankProgress'
import { getRankOrder } from '../constants/ranks'

// Mirrors the DB function: given current rank state + approved count, returns
// the rank that SHOULD be awarded, or null if no award should happen.
function shouldAwardRank(params: {
  currentTier: string | null
  currentMethod: string | null
  challengeTier: string
  approvedCount: number
}): string | null {
  const { currentTier, currentMethod, challengeTier, approvedCount } = params

  // Re-use the same progression table as getProgressInfo
  const dummyChallenges = [{ id: 1, tier: challengeTier }]
  const info = getProgressInfo(currentTier, [], dummyChallenges)

  // This challenge must be the tier required for next rank
  if (challengeTier !== info.challengeTier) return null
  if (approvedCount < info.required) return null

  // Never downgrade a community_verified rank
  if (currentMethod === 'community_verified' && currentTier) {
    if (getRankOrder(info.nextRank) >= getRankOrder(currentTier)) return null
  }

  return info.nextRank
}

// ── unranked path ──────────────────────────────────────────────────────────────

describe('unranked player', () => {
  it('awards Platinum after 5 approved Platinum challenges', () => {
    expect(shouldAwardRank({
      currentTier: null, currentMethod: null,
      challengeTier: 'Platinum', approvedCount: 5,
    })).toBe('Platinum')
  })

  it('does not award with fewer than 5', () => {
    for (let n = 0; n < 5; n++) {
      expect(shouldAwardRank({
        currentTier: null, currentMethod: null,
        challengeTier: 'Platinum', approvedCount: n,
      })).toBeNull()
    }
  })

  it('does not award for a Diamond challenge (wrong tier)', () => {
    expect(shouldAwardRank({
      currentTier: null, currentMethod: null,
      challengeTier: 'Diamond', approvedCount: 99,
    })).toBeNull()
  })
})

// ── standard progression ───────────────────────────────────────────────────────

describe('standard progression per tier', () => {
  const cases: Array<[string, string, number, string]> = [
    ['Bronze I',   'Platinum', 5, 'Platinum'],
    ['Bronze II',  'Platinum', 5, 'Platinum'],
    ['Bronze III', 'Platinum', 5, 'Platinum'],
    ['Silver I',   'Platinum', 4, 'Platinum'],
    ['Silver II',  'Platinum', 4, 'Platinum'],
    ['Silver III', 'Platinum', 4, 'Platinum'],
    ['Gold',       'Platinum', 3, 'Platinum'],
    ['Platinum',   'Diamond',  2, 'Diamond'],
    ['Diamond',    'Master',   2, 'Master'],
    ['Master',     'Grandmaster', 1, 'Grandmaster'],
  ]

  for (const [tier, challengeTier, required, nextRank] of cases) {
    it(`${tier} + ${required} ${challengeTier} challenges → ${nextRank}`, () => {
      expect(shouldAwardRank({
        currentTier: tier, currentMethod: null,
        challengeTier, approvedCount: required,
      })).toBe(nextRank)
    })

    it(`${tier} is not awarded with ${required - 1} challenges`, () => {
      expect(shouldAwardRank({
        currentTier: tier, currentMethod: null,
        challengeTier, approvedCount: required - 1,
      })).toBeNull()
    })
  }
})

// ── anti-downgrade guard ───────────────────────────────────────────────────────

describe('anti-downgrade guard (community_verified)', () => {
  it('does not re-award the same rank', () => {
    // Already Platinum via community_verified — completing 5 more Platinum
    // challenges should not "re-award" Platinum
    expect(shouldAwardRank({
      currentTier: 'Platinum', currentMethod: 'community_verified',
      challengeTier: 'Diamond', approvedCount: 2,
    })).toBe('Diamond') // progressing UP is fine

    // But a Bronze with community_verified Platinum should not be downgraded
    // (this shouldn't happen in normal flow but the guard must hold)
    expect(shouldAwardRank({
      currentTier: 'Diamond', currentMethod: 'community_verified',
      challengeTier: 'Diamond', approvedCount: 2,
    })).toBeNull() // Master is the next rank, but Diamond→Diamond is no-op
  })

  it('allows upgrade even with community_verified method', () => {
    expect(shouldAwardRank({
      currentTier: 'Platinum', currentMethod: 'community_verified',
      challengeTier: 'Diamond', approvedCount: 2,
    })).toBe('Diamond')
  })

  it('always allows upgrade regardless of method', () => {
    for (const method of ['community_verified', 'admin', null]) {
      expect(shouldAwardRank({
        currentTier: 'Gold', currentMethod: method,
        challengeTier: 'Platinum', approvedCount: 3,
      })).toBe('Platinum')
    }
  })
})

// ── wrong challenge tier ───────────────────────────────────────────────────────

describe('wrong challenge tier', () => {
  it('does not award if challenge tier does not match progression', () => {
    // Platinum player needs Diamond challenges — a Master challenge does nothing
    expect(shouldAwardRank({
      currentTier: 'Platinum', currentMethod: null,
      challengeTier: 'Master', approvedCount: 99,
    })).toBeNull()

    // Bronze player needs Platinum — Diamond does nothing
    expect(shouldAwardRank({
      currentTier: 'Bronze I', currentMethod: null,
      challengeTier: 'Diamond', approvedCount: 99,
    })).toBeNull()
  })
})
