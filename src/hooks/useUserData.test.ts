import { vi, beforeEach, describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserData } from './useUserData';

const mocks = vi.hoisted(() => ({
  dbUser: null as Record<string, unknown> | null,
  ranks: [] as unknown[],
  statues: [] as unknown[],
}));

vi.mock('../services/supabase', () => ({
  getUserBySteamId: vi.fn().mockImplementation(() =>
    Promise.resolve(mocks.dbUser)
  ),
  getUserRanks: vi.fn().mockImplementation(() =>
    Promise.resolve(mocks.ranks)
  ),
  getUserStatues: vi.fn().mockImplementation(() =>
    Promise.resolve(mocks.statues)
  ),
  checkAchievements: vi.fn().mockResolvedValue(undefined),
}));

const STEAM_USER = { steamId: 'steam123', username: 'tester', avatarUrl: '', token: 'tok' };

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  mocks.dbUser = null;
  mocks.ranks = [];
  mocks.statues = [];
  vi.clearAllMocks();
});

// ── isBanned ──────────────────────────────────────────────────────────────────

describe('isBanned', () => {
  it('returns false when user is not banned', async () => {
    mocks.dbUser = { id: 'u1', username: 'tester', is_banned: false, ban_reason: null, banned_until: null };
    const { result } = renderHook(() => useUserData(STEAM_USER, []), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBanned).toBe(false);
  });

  it('returns true when permanently banned (banned_until is null)', async () => {
    mocks.dbUser = { id: 'u1', username: 'tester', is_banned: true, ban_reason: 'cheating', banned_until: null };
    const { result } = renderHook(() => useUserData(STEAM_USER, []), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBanned).toBe(true);
  });

  it('returns true when temp ban has not expired', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    mocks.dbUser = { id: 'u1', username: 'tester', is_banned: true, ban_reason: 'cheating', banned_until: future };
    const { result } = renderHook(() => useUserData(STEAM_USER, []), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBanned).toBe(true);
  });

  it('returns false when temp ban has expired', async () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    mocks.dbUser = { id: 'u1', username: 'tester', is_banned: true, ban_reason: 'cheating', banned_until: past };
    const { result } = renderHook(() => useUserData(STEAM_USER, []), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBanned).toBe(false);
  });
});

// ── refreshRanks ──────────────────────────────────────────────────────────────

describe('refreshRanks', () => {
  it('does not throw when called', async () => {
    mocks.dbUser = { id: 'u1', username: 'tester', is_banned: false, ban_reason: null, banned_until: null };
    const { result } = renderHook(() => useUserData(STEAM_USER, []), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(() => result.current.refreshRanks()).not.toThrow();
  });
});

// ── null user ─────────────────────────────────────────────────────────────────

describe('null user', () => {
  it('returns null ids and empty arrays without querying', async () => {
    const { result } = renderHook(() => useUserData(null, []), { wrapper: makeWrapper() });

    // No queries fire — result is immediately stable
    expect(result.current.dbUserId).toBeNull();
    expect(result.current.dbUsername).toBeNull();
    expect(result.current.ranks).toEqual([]);
    expect(result.current.statues).toEqual([]);
    expect(result.current.isBanned).toBe(false);
  });
});
