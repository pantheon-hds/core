import { vi, beforeEach, describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSubmissions } from './useSubmissions';

// vi.hoisted ensures these refs are available inside the vi.mock factory,
// which is hoisted to the top of the file before any imports are evaluated.
const mocks = vi.hoisted(() => ({
  submissionsData: [] as unknown[],
  insertError: null as string | null,
  updateError: null as string | null,
}));

vi.mock('../services/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: mocks.submissionsData, error: null })
        ),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() =>
            mocks.insertError
              ? Promise.resolve({ data: null, error: { message: mocks.insertError } })
              : Promise.resolve({ data: { id: 'inserted-id' }, error: null })
          ),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() =>
          mocks.updateError
            ? Promise.resolve({ data: null, error: { message: mocks.updateError } })
            : Promise.resolve({ data: null, error: null })
        ),
      }),
    })),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
  assignJudges: vi.fn().mockResolvedValue(true),
}));

const SUBMIT_PARAMS = {
  challengeId: 1,
  videoUrl: 'https://www.youtube.com/watch?v=test',
  comment: null,
  token: 'test-token',
};

beforeEach(() => {
  mocks.submissionsData = [];
  mocks.insertError = null;
  mocks.updateError = null;
  vi.clearAllMocks();
});

// ── hasActiveSubmission ───────────────────────────────────────────────────────

describe('hasActiveSubmission', () => {
  it('returns false when there are no submissions', async () => {
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions).toEqual([]));
    expect(result.current.hasActiveSubmission()).toBe(false);
  });

  it('returns true when there is a pending submission', async () => {
    mocks.submissionsData = [{ id: 's1', status: 'pending', cooldown_until: null }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));
    expect(result.current.hasActiveSubmission()).toBe(true);
  });

  it('returns true when there is an in_review submission', async () => {
    mocks.submissionsData = [{ id: 's1', status: 'in_review', cooldown_until: null }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));
    expect(result.current.hasActiveSubmission()).toBe(true);
  });

  it('returns false when all submissions are resolved', async () => {
    mocks.submissionsData = [
      { id: 's1', status: 'approved', cooldown_until: null },
      { id: 's2', status: 'rejected', cooldown_until: null },
      { id: 's3', status: 'withdrawn', cooldown_until: null },
    ];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(3));
    expect(result.current.hasActiveSubmission()).toBe(false);
  });
});

// ── isOnCooldown ──────────────────────────────────────────────────────────────

describe('isOnCooldown', () => {
  it('returns false when no cooldown is set', async () => {
    mocks.submissionsData = [{ id: 's1', status: 'withdrawn', cooldown_until: null }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));
    expect(result.current.isOnCooldown()).toBe(false);
  });

  it('returns true when cooldown expires in the future', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    mocks.submissionsData = [{ id: 's1', status: 'withdrawn', cooldown_until: future }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));
    expect(result.current.isOnCooldown()).toBe(true);
  });

  it('returns false when cooldown has already expired', async () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    mocks.submissionsData = [{ id: 's1', status: 'withdrawn', cooldown_until: past }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));
    expect(result.current.isOnCooldown()).toBe(false);
  });
});

// ── submit guards ─────────────────────────────────────────────────────────────

describe('submit — validation guards', () => {
  it('rejects when there is an active pending submission', async () => {
    mocks.submissionsData = [{ id: 's1', status: 'pending', cooldown_until: null }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));

    const res = await result.current.submit(SUBMIT_PARAMS);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/active submission/i);
  });

  it('rejects when on cooldown', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    mocks.submissionsData = [{ id: 's1', status: 'withdrawn', cooldown_until: future }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));

    const res = await result.current.submit(SUBMIT_PARAMS);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/cooldown/i);
  });

  it('rejects when dbUserId is null', async () => {
    const { result } = renderHook(() => useSubmissions(null, 'tok'));

    const res = await result.current.submit(SUBMIT_PARAMS);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not authenticated/i);
  });
});

// ── submit success ────────────────────────────────────────────────────────────

describe('submit — success path', () => {
  it('resolves with the real db id after a successful insert', async () => {
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submitting).toBe(false));

    let res!: Awaited<ReturnType<typeof result.current.submit>>;
    await act(async () => { res = await result.current.submit(SUBMIT_PARAMS); });

    expect(res.success).toBe(true);
    expect(result.current.submissions).toHaveLength(1);
    expect(result.current.submissions[0].id).toBe('inserted-id');
    expect(result.current.submissions[0].status).toBe('pending');
  });

  it('returns submitting=true during the call and false after', async () => {
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submitting).toBe(false));

    let submitPromise!: ReturnType<typeof result.current.submit>;
    act(() => { submitPromise = result.current.submit(SUBMIT_PARAMS); });

    await waitFor(() => expect(result.current.submitting).toBe(true));
    await act(async () => { await submitPromise; });
    expect(result.current.submitting).toBe(false);
  });
});

// ── submit rollback ───────────────────────────────────────────────────────────

describe('submit — error path', () => {
  it('rolls back the optimistic entry and returns an error on insert failure', async () => {
    mocks.insertError = 'duplicate key value';
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submitting).toBe(false));

    let res!: Awaited<ReturnType<typeof result.current.submit>>;
    await act(async () => { res = await result.current.submit(SUBMIT_PARAMS); });

    expect(res.success).toBe(false);
    expect(res.error).toBe('duplicate key value');
    expect(result.current.submissions).toHaveLength(0);
  });
});

// ── getSubmissionStatus ───────────────────────────────────────────────────────

describe('getSubmissionStatus', () => {
  it('returns the submission matching the given challenge id', async () => {
    mocks.submissionsData = [{ id: 's1', challenge_id: 42, status: 'pending', cooldown_until: null }];
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions.length).toBe(1));

    const found = result.current.getSubmissionStatus(42);
    expect(found?.id).toBe('s1');
  });

  it('returns undefined when no submission matches', async () => {
    const { result } = renderHook(() => useSubmissions('user1', 'tok'));
    await waitFor(() => expect(result.current.submissions).toEqual([]));
    expect(result.current.getSubmissionStatus(99)).toBeUndefined();
  });
});
