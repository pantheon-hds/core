import { vi, beforeEach, describe, it, expect } from 'vitest';
import { recordJudgeVote } from './submissionService';

// Mock import.meta.env
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Mock supabase (required by the module even though recordJudgeVote doesn't use it)
vi.mock('./supabase', () => ({
  supabase: { from: vi.fn() },
  assignJudges: vi.fn(),
  fetchMySubmissions: vi.fn(),
  submitChallenge: vi.fn(),
  withdrawSubmission: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockEdgeFn(response: object, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: async () => response,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('recordJudgeVote', () => {

  describe('not yet finalised', () => {
    it('returns finalised=false when only 1 of 3 judges voted', async () => {
      mockEdgeFn({ success: true, finalised: false });

      const result = await recordJudgeVote('assign-1', 'sub-1', 'approved', '1:23', 'token');

      expect(result.success).toBe(true);
      expect(result.finalised).toBe(false);
    });

    it('returns finalised=false when votes are split (1 approve, 1 reject out of 3)', async () => {
      mockEdgeFn({ success: true, finalised: false });

      const result = await recordJudgeVote('assign-2', 'sub-1', 'rejected', '2:00', 'token');

      expect(result.success).toBe(true);
      expect(result.finalised).toBe(false);
    });
  });

  describe('majority reached — approved', () => {
    it('returns finalised=true when 2/3 judges approve', async () => {
      mockEdgeFn({ success: true, finalised: true, finalStatus: 'approved' });

      const result = await recordJudgeVote('assign-3', 'sub-1', 'approved', '3:45', 'token');

      expect(result.success).toBe(true);
      expect(result.finalised).toBe(true);
    });
  });

  describe('majority reached — rejected', () => {
    it('returns finalised=true when 2/3 judges reject', async () => {
      mockEdgeFn({ success: true, finalised: true, finalStatus: 'rejected' });

      const result = await recordJudgeVote('assign-4', 'sub-1', 'rejected', '1:00', 'token');

      expect(result.success).toBe(true);
      expect(result.finalised).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns error when Edge Function returns success=false', async () => {
      mockEdgeFn({ success: false, error: 'Assignment not found or not yours' });

      const result = await recordJudgeVote('assign-x', 'sub-1', 'approved', '1:00', 'token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Assignment not found or not yours');
      expect(result.finalised).toBe(false);
    });

    it('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await recordJudgeVote('assign-x', 'sub-1', 'approved', '1:00', 'token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.finalised).toBe(false);
    });

    it('sends correct payload to Edge Function', async () => {
      mockEdgeFn({ success: true, finalised: false });

      await recordJudgeVote('assign-99', 'sub-99', 'approved', '5:30 - condition met', 'my-token');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/functions/v1/profile-action');
      expect(options.headers['x-session-token']).toBe('my-token');

      const body = JSON.parse(options.body);
      expect(body.action).toBe('record-judge-vote');
      expect(body.assignmentId).toBe('assign-99');
      expect(body.submissionId).toBe('sub-99');
      expect(body.vote).toBe('approved');
      expect(body.timestampNote).toBe('5:30 - condition met');
    });
  });
});

// ── Pure majority logic ───────────────────────────────────────────────────────
// Tests for the 2/3 majority formula used in the Edge Function.
// We test the formula directly here so it's fast and deterministic.

describe('majority calculation logic (2/3 rule)', () => {
  function calcMajority(votes: Array<'approved' | 'rejected' | null>) {
    const totalJudges = votes.length;
    const approvedVotes = votes.filter(v => v === 'approved').length;
    const rejectedVotes = votes.filter(v => v === 'rejected').length;
    const majority = Math.ceil(totalJudges / 2);

    if (approvedVotes >= majority) return 'approved';
    if (rejectedVotes >= majority) return 'rejected';
    return null; // not yet decided
  }

  it('3 judges: requires 2 approvals to approve', () => {
    expect(calcMajority(['approved', 'approved', null])).toBe('approved');
  });

  it('3 judges: requires 2 rejections to reject', () => {
    expect(calcMajority(['rejected', 'rejected', null])).toBe('rejected');
  });

  it('3 judges: 1 approve is not enough', () => {
    expect(calcMajority(['approved', null, null])).toBeNull();
  });

  it('3 judges: 1 approve + 1 reject is not decided yet', () => {
    expect(calcMajority(['approved', 'rejected', null])).toBeNull();
  });

  it('3 judges: all approve → approved', () => {
    expect(calcMajority(['approved', 'approved', 'approved'])).toBe('approved');
  });

  it('3 judges: all reject → rejected', () => {
    expect(calcMajority(['rejected', 'rejected', 'rejected'])).toBe('rejected');
  });

  it('3 judges: 2 approve + 1 reject → approved (majority wins)', () => {
    expect(calcMajority(['approved', 'approved', 'rejected'])).toBe('approved');
  });

  it('3 judges: 2 reject + 1 approve → rejected (majority wins)', () => {
    expect(calcMajority(['rejected', 'rejected', 'approved'])).toBe('rejected');
  });
});
