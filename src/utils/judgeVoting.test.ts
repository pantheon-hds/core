import { describe, it, expect } from 'vitest'
import { resolveVotes } from './judgeVoting'
import type { Vote } from './judgeVoting'

// ── 3-judge panel ──────────────────────────────────────────────────────────────

describe('3-judge panel', () => {
  it('is not finalised when no votes cast', () => {
    const result = resolveVotes([null, null, null])
    expect(result.finalised).toBe(false)
  })

  it('is not finalised after 1 approval', () => {
    const result = resolveVotes(['approved', null, null])
    expect(result.finalised).toBe(false)
  })

  it('is not finalised after 1 rejection', () => {
    const result = resolveVotes(['rejected', null, null])
    expect(result.finalised).toBe(false)
  })

  it('is not finalised with 1 approval and 1 rejection pending', () => {
    const result = resolveVotes(['approved', 'rejected', null])
    expect(result.finalised).toBe(false)
  })

  it('finalises approved early when 2/3 approve', () => {
    const result = resolveVotes(['approved', 'approved', null])
    expect(result).toEqual({ finalised: true, finalStatus: 'approved' })
  })

  it('finalises approved when all 3 approve', () => {
    const result = resolveVotes(['approved', 'approved', 'approved'])
    expect(result).toEqual({ finalised: true, finalStatus: 'approved' })
  })

  it('finalises approved when 2 approve and 1 rejects', () => {
    const result = resolveVotes(['approved', 'approved', 'rejected'])
    expect(result).toEqual({ finalised: true, finalStatus: 'approved' })
  })

  it('finalises rejected early when 2/3 reject', () => {
    const result = resolveVotes(['rejected', 'rejected', null])
    expect(result).toEqual({ finalised: true, finalStatus: 'rejected' })
  })

  it('finalises rejected when all 3 reject', () => {
    const result = resolveVotes(['rejected', 'rejected', 'rejected'])
    expect(result).toEqual({ finalised: true, finalStatus: 'rejected' })
  })

  it('finalises rejected when 2 reject and 1 approves', () => {
    const result = resolveVotes(['approved', 'rejected', 'rejected'])
    expect(result).toEqual({ finalised: true, finalStatus: 'rejected' })
  })
})

// ── 2-judge panel ──────────────────────────────────────────────────────────────

describe('2-judge panel', () => {
  it('is not finalised when no votes cast', () => {
    const result = resolveVotes([null, null])
    expect(result.finalised).toBe(false)
  })

  it('is not finalised after only 1 vote (approved)', () => {
    const result = resolveVotes(['approved', null])
    expect(result.finalised).toBe(false)
    if (!result.finalised) expect(result.tiebreak).toBeUndefined()
  })

  it('is not finalised after only 1 vote (rejected)', () => {
    const result = resolveVotes(['rejected', null])
    expect(result.finalised).toBe(false)
  })

  it('finalises approved when both approve', () => {
    const result = resolveVotes(['approved', 'approved'])
    expect(result).toEqual({ finalised: true, finalStatus: 'approved' })
  })

  it('finalises rejected when both reject', () => {
    const result = resolveVotes(['rejected', 'rejected'])
    expect(result).toEqual({ finalised: true, finalStatus: 'rejected' })
  })

  it('signals tiebreak on 1-1 split', () => {
    const result = resolveVotes(['approved', 'rejected'])
    expect(result.finalised).toBe(false)
    if (!result.finalised) expect(result.tiebreak).toBe(true)
  })

  it('tiebreak also fires regardless of vote order', () => {
    const result = resolveVotes(['rejected', 'approved'])
    expect(result.finalised).toBe(false)
    if (!result.finalised) expect(result.tiebreak).toBe(true)
  })
})

// ── edge cases ─────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('returns not finalised for empty panel', () => {
    expect(resolveVotes([]).finalised).toBe(false)
  })

  it('returns not finalised for single judge', () => {
    const cases: Vote[][] = [[null], ['approved'], ['rejected']]
    for (const votes of cases) {
      expect(resolveVotes(votes).finalised).toBe(false)
    }
  })

  it('returns not finalised for panels larger than 3', () => {
    expect(resolveVotes(['approved', 'approved', 'approved', 'approved']).finalised).toBe(false)
  })
})
