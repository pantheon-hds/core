import { vi, beforeEach, describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChallenges } from './useChallenges';

const mocks = vi.hoisted(() => ({
  challenges: [] as unknown[],
  games: [] as unknown[],
}));

vi.mock('../services/challengeService', () => ({
  fetchChallenges: vi.fn().mockImplementation(() => Promise.resolve(mocks.challenges)),
  fetchGames: vi.fn().mockImplementation(() => Promise.resolve(mocks.games)),
}));

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  mocks.challenges = [];
  mocks.games = [];
  vi.clearAllMocks();
});

describe('useChallenges', () => {
  it('returns empty arrays before data loads', () => {
    const { result } = renderHook(() => useChallenges(), { wrapper: makeWrapper() });
    expect(result.current.challenges).toEqual([]);
    expect(result.current.games).toEqual([]);
  });

  it('returns fetched challenges and games', async () => {
    mocks.challenges = [
      { id: 1, title: 'Challenge One', tier: 'Bronze', game_id: 10, game: { id: 10, title: 'Game A' } },
    ];
    mocks.games = [
      { id: 10, steam_app_id: '123', title: 'Game A' },
    ];

    const { result } = renderHook(() => useChallenges(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.challenges.length).toBe(1));
    expect(result.current.challenges[0].title).toBe('Challenge One');
    expect(result.current.games[0].title).toBe('Game A');
  });
});
