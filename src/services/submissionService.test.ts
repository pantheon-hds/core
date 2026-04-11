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
// Mirrors the logic in profile-action Edge Function (record-judge-vote).

type Vote = 'approved' | 'rejected' | null;
type Result = 'approved' | 'rejected' | 'tiebreak' | null;

function calcMajority(votes: Vote[]): Result {
  const totalJudges = votes.length;
  const votedCount = votes.filter(v => v !== null).length;
  const approvedVotes = votes.filter(v => v === 'approved').length;
  const rejectedVotes = votes.filter(v => v === 'rejected').length;

  if (totalJudges === 3) {
    if (approvedVotes >= 2) return 'approved';
    if (rejectedVotes >= 2) return 'rejected';
    return null;
  }

  if (totalJudges === 2) {
    if (votedCount < 2) return null; // waiting for second vote
    if (approvedVotes === 2) return 'approved';
    if (rejectedVotes === 2) return 'rejected';
    return 'tiebreak'; // 1-1 → Voland decides
  }

  return null;
}

describe('majority logic — 3 judges', () => {
  it('1 approve is not enough', () => {
    expect(calcMajority(['approved', null, null])).toBeNull();
  });

  it('2 approvals → approved immediately (early finalisation)', () => {
    expect(calcMajority(['approved', 'approved', null])).toBe('approved');
  });

  it('2 rejections → rejected immediately', () => {
    expect(calcMajority(['rejected', 'rejected', null])).toBe('rejected');
  });

  it('1 approve + 1 reject → not decided yet', () => {
    expect(calcMajority(['approved', 'rejected', null])).toBeNull();
  });

  it('all approve → approved', () => {
    expect(calcMajority(['approved', 'approved', 'approved'])).toBe('approved');
  });

  it('all reject → rejected', () => {
    expect(calcMajority(['rejected', 'rejected', 'rejected'])).toBe('rejected');
  });

  it('2 approve + 1 reject → approved', () => {
    expect(calcMajority(['approved', 'approved', 'rejected'])).toBe('approved');
  });

  it('2 reject + 1 approve → rejected', () => {
    expect(calcMajority(['rejected', 'rejected', 'approved'])).toBe('rejected');
  });
});

describe('majority logic — 2 judges', () => {
  it('1 vote cast, 1 pending → not decided yet', () => {
    expect(calcMajority(['approved', null])).toBeNull();
  });

  it('both approve → approved', () => {
    expect(calcMajority(['approved', 'approved'])).toBe('approved');
  });

  it('both reject → rejected', () => {
    expect(calcMajority(['rejected', 'rejected'])).toBe('rejected');
  });

  it('1 approve + 1 reject → tiebreak (Voland decides)', () => {
    expect(calcMajority(['approved', 'rejected'])).toBe('tiebreak');
  });
});
