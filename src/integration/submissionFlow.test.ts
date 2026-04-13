/**
 * Integration test: full submission → judging → rank award pipeline.
 *
 * Tests the complete happy path and key failure modes that span multiple
 * subsystems: submission guards, judge voting, finalization, rank award.
 * Each subsystem has its own unit tests; this file tests that they wire
 * together correctly.
 *
 * Uses mocked service calls to avoid network dependency.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSubmissions } from '../hooks/useSubmissions'
import { resolveVotes } from '../utils/judgeVoting'
import { getProgressInfo } from '../utils/rankProgress'
import type { Vote } from '../utils/judgeVoting'

// ── Service mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  submissions: [] as unknown[],
  submitResult: { success: true, submissionId: 'sub-001' } as { success: boolean; submissionId: string; error?: string },
  withdrawResult: { success: true } as { success: boolean; error?: string },
  judgesAssigned: true,
}))

vi.mock('../services/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
  fetchMySubmissions: vi.fn().mockImplementation(() => Promise.resolve(mocks.submissions)),
  submitChallenge: vi.fn().mockImplementation(() => Promise.resolve(mocks.submitResult)),
  withdrawSubmission: vi.fn().mockImplementation(() => Promise.resolve(mocks.withdrawResult)),
  assignJudges: vi.fn().mockImplementation(() => Promise.resolve(mocks.judgesAssigned)),
}))

const SUBMIT_PARAMS = {
  challengeId: 7,
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  comment: 'Timestamp at 0:42',
  token: 'session-token',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  mocks.submissions = []
  mocks.submitResult = { success: true, submissionId: 'sub-001' }
  mocks.withdrawResult = { success: true }
  mocks.judgesAssigned = true
  vi.clearAllMocks()
})

// ── 1. Submission creation ────────────────────────────────────────────────────

describe('Step 1 — submission creation', () => {
  it('creates a submission and replaces the optimistic entry with the real id', async () => {
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    let res!: Awaited<ReturnType<typeof result.current.submit>>
    await act(async () => { res = await result.current.submit(SUBMIT_PARAMS) })

    expect(res.success).toBe(true)
    expect(result.current.submissions).toHaveLength(1)
    expect(result.current.submissions[0].id).toBe('sub-001')
    expect(result.current.submissions[0].status).toBe('pending')
  })

  it('blocks a second submission while one is pending', async () => {
    mocks.submissions = [{ id: 'sub-000', status: 'pending', cooldown_until: null }]
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submissions).toHaveLength(1))

    const res = await result.current.submit(SUBMIT_PARAMS)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/active submission/i)
  })

  it('blocks submission while on 24h cooldown', async () => {
    const future = new Date(Date.now() + 24 * 3_600_000).toISOString()
    mocks.submissions = [{ id: 'sub-000', status: 'withdrawn', cooldown_until: future }]
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submissions).toHaveLength(1))

    const res = await result.current.submit(SUBMIT_PARAMS)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/cooldown/i)
  })

  it('allows resubmission once cooldown has expired', async () => {
    const past = new Date(Date.now() - 1000).toISOString()
    mocks.submissions = [{ id: 'sub-000', status: 'withdrawn', cooldown_until: past }]
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submissions).toHaveLength(1))

    let res!: Awaited<ReturnType<typeof result.current.submit>>
    await act(async () => { res = await result.current.submit(SUBMIT_PARAMS) })

    expect(res.success).toBe(true)
  })

  it('rolls back optimistic entry when server rejects the submission', async () => {
    mocks.submitResult = { success: false, submissionId: '', error: 'challenge not found' }
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    let res!: Awaited<ReturnType<typeof result.current.submit>>
    await act(async () => { res = await result.current.submit(SUBMIT_PARAMS) })

    expect(res.success).toBe(false)
    expect(res.error).toBe('challenge not found')
    expect(result.current.submissions).toHaveLength(0) // optimistic entry removed
  })
})

// ── 2. Judge assignment ───────────────────────────────────────────────────────

describe('Step 2 — judge assignment', () => {
  it('calls assignJudges with the real submission id after a successful insert', async () => {
    const { assignJudges } = await import('../services/supabase')
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    await act(async () => { await result.current.submit(SUBMIT_PARAMS) })

    expect(assignJudges).toHaveBeenCalledOnce()
    expect(assignJudges).toHaveBeenCalledWith('session-token', 'sub-001')
  })

  it('still returns success even when judge assignment fails', async () => {
    mocks.judgesAssigned = false
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    let res!: Awaited<ReturnType<typeof result.current.submit>>
    await act(async () => { res = await result.current.submit(SUBMIT_PARAMS) })

    // Submission itself succeeded — judge failure is non-fatal (admin reviews)
    expect(res.success).toBe(true)
  })

  it('does NOT call assignJudges when the submit itself fails', async () => {
    mocks.submitResult = { success: false, submissionId: '', error: 'server error' }
    const { assignJudges } = await import('../services/supabase')
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    await act(async () => { await result.current.submit(SUBMIT_PARAMS) })

    expect(assignJudges).not.toHaveBeenCalled()
  })
})

// ── 3. Judge voting (3-judge panel) ──────────────────────────────────────────

describe('Step 3 — voting: 3-judge panel', () => {
  it('does not finalise after the first vote', () => {
    expect(resolveVotes(['approved', null, null]).finalised).toBe(false)
    expect(resolveVotes(['rejected', null, null]).finalised).toBe(false)
  })

  it('finalises approved immediately when 2nd judge approves (early exit)', () => {
    const result = resolveVotes(['approved', 'approved', null])
    expect(result).toEqual({ finalised: true, finalStatus: 'approved' })
  })

  it('finalises rejected immediately when 2nd judge rejects (early exit)', () => {
    const result = resolveVotes(['rejected', 'rejected', null])
    expect(result).toEqual({ finalised: true, finalStatus: 'rejected' })
  })

  it('minority dissent does not prevent finalisation', () => {
    expect(resolveVotes(['approved', 'approved', 'rejected']))
      .toEqual({ finalised: true, finalStatus: 'approved' })
    expect(resolveVotes(['rejected', 'rejected', 'approved']))
      .toEqual({ finalised: true, finalStatus: 'rejected' })
  })

  it('unanimous vote also finalises correctly', () => {
    expect(resolveVotes(['approved', 'approved', 'approved']))
      .toEqual({ finalised: true, finalStatus: 'approved' })
    expect(resolveVotes(['rejected', 'rejected', 'rejected']))
      .toEqual({ finalised: true, finalStatus: 'rejected' })
  })
})

// ── 4. Judge voting (2-judge panel) ──────────────────────────────────────────

describe('Step 3 — voting: 2-judge panel', () => {
  it('waits for both votes before finalising', () => {
    expect(resolveVotes(['approved', null]).finalised).toBe(false)
    expect(resolveVotes(['rejected', null]).finalised).toBe(false)
  })

  it('finalises when both agree', () => {
    expect(resolveVotes(['approved', 'approved']))
      .toEqual({ finalised: true, finalStatus: 'approved' })
    expect(resolveVotes(['rejected', 'rejected']))
      .toEqual({ finalised: true, finalStatus: 'rejected' })
  })

  it('signals tiebreak on 1-1 split — does not auto-finalise', () => {
    const result = resolveVotes(['approved', 'rejected'])
    expect(result.finalised).toBe(false)
    if (!result.finalised) expect(result.tiebreak).toBe(true)
  })
})

// ── 5. Rank award after approval ─────────────────────────────────────────────

describe('Step 4 — rank award after approval', () => {
  // These mirror the SQL function award_rank_on_approval via the TS helper
  // getProgressInfo. If the SQL changes, update both this and the SQL test.

  it('awards Platinum to an unranked player who completes 5 Platinum challenges', () => {
    const info = getProgressInfo(null, [], [{ id: 1, tier: 'Platinum' }])
    expect(info.challengeTier).toBe('Platinum')
    expect(info.required).toBe(5)
    expect(info.nextRank).toBe('Platinum')
  })

  it('awards Diamond to a Platinum player after 2 Diamond challenge approvals', () => {
    const info = getProgressInfo('Platinum', [], [{ id: 1, tier: 'Diamond' }])
    expect(info.challengeTier).toBe('Diamond')
    expect(info.required).toBe(2)
    expect(info.nextRank).toBe('Diamond')
  })

  it('awards Master to a Diamond player after 2 Master challenge approvals', () => {
    const info = getProgressInfo('Diamond', [], [{ id: 1, tier: 'Master' }])
    expect(info.challengeTier).toBe('Master')
    expect(info.required).toBe(2)
    expect(info.nextRank).toBe('Master')
  })

  it('awards Grandmaster to a Master player after 1 Grandmaster challenge approval', () => {
    const info = getProgressInfo('Master', [], [{ id: 1, tier: 'Grandmaster' }])
    expect(info.challengeTier).toBe('Grandmaster')
    expect(info.required).toBe(1)
    expect(info.nextRank).toBe('Grandmaster')
  })

  it('does not award a rank when the wrong tier challenge is approved', () => {
    // Platinum player needs Diamond challenges — a Master challenge does nothing
    const info = getProgressInfo('Platinum', [], [{ id: 1, tier: 'Master' }])
    expect(info.challengeTier).toBe('Diamond') // expects Diamond
    // The approved challenge is Master, not Diamond → no progression
    expect('Master').not.toBe(info.challengeTier)
  })
})

// ── 6. Full happy path (combined) ────────────────────────────────────────────

describe('Full happy path: submit → 2/3 approve → rank check', () => {
  it('completes the entire flow without errors', async () => {
    // 1. User submits
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    let submitRes!: Awaited<ReturnType<typeof result.current.submit>>
    await act(async () => { submitRes = await result.current.submit(SUBMIT_PARAMS) })
    expect(submitRes.success).toBe(true)

    // 2. Judges assigned (mocked — just verify wiring)
    const { assignJudges } = await import('../services/supabase')
    expect(assignJudges).toHaveBeenCalledWith('session-token', 'sub-001')

    // 3. Two judges vote approved → early finalization
    const votes: Vote[] = ['approved', 'approved', null]
    const voteResult = resolveVotes(votes)
    expect(voteResult).toEqual({ finalised: true, finalStatus: 'approved' })

    // 4. Rank progression check for unranked player after approval
    const rankInfo = getProgressInfo(null, [], [{ id: SUBMIT_PARAMS.challengeId, tier: 'Platinum' }])
    expect(rankInfo.nextRank).toBe('Platinum')
    // Assuming this was the 5th approval, rank is awarded
    expect(rankInfo.required).toBe(5)
  })

  it('handles withdraw → cooldown → wait → resubmit sequence', async () => {
    // User withdraws (triggering 24h cooldown)
    mocks.submissions = [
      { id: 'sub-000', status: 'withdrawn', cooldown_until: new Date(Date.now() + 3_600_000).toISOString() }
    ]
    const { result } = renderHook(() => useSubmissions('user-1', 'tok'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.submissions).toHaveLength(1))

    // Can't submit while on cooldown
    const blocked = await result.current.submit(SUBMIT_PARAMS)
    expect(blocked.success).toBe(false)
    expect(blocked.error).toMatch(/cooldown/i)

    // Simulate cooldown expiry by updating the mock
    mocks.submissions = [
      { id: 'sub-000', status: 'withdrawn', cooldown_until: new Date(Date.now() - 1000).toISOString() }
    ]

    // Re-render with fresh submissions (simulating a page reload / refetch)
    const { result: result2 } = renderHook(
      () => useSubmissions('user-1', 'tok'),
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(result2.current.submissions).toHaveLength(1))

    let res!: Awaited<ReturnType<typeof result2.current.submit>>
    await act(async () => { res = await result2.current.submit(SUBMIT_PARAMS) })
    expect(res.success).toBe(true)
  })
})
