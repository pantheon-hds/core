import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserByToken, getUserRanks, getUserStatues, checkAchievements } from '../services/supabase';
import type { SteamUser } from '../components/pages/SteamCallback';
import type { UserRank, UserStatue } from '../types';

interface Game { id: number; steam_app_id: string; title: string; }

interface UseUserDataResult {
  dbUserId: string | null;
  dbUsername: string | null;
  ranks: UserRank[];
  statues: UserStatue[];
  refreshRanks: () => void;
  isLoading: boolean;
  isError: boolean;
  isBanned: boolean;
  banReason: string | null;
  banUntil: string | null;
  isAdmin: boolean;
  isJudge: boolean;
}

export function useUserData(user: SteamUser | null, games: Game[]): UseUserDataResult {
  const queryClient = useQueryClient();

  const { data: dbUser, isLoading: dbUserLoading } = useQuery({
    queryKey: ['dbUser', user?.steamId],
    queryFn: () => getUserByToken(user!.token),
    enabled: !!user,
    staleTime: 30 * 1000, // 30s — short so bans take effect quickly
  });

  const { data: ranks = [], isLoading: ranksLoading, isError: ranksError } = useQuery({
    queryKey: ['ranks', dbUser?.id],
    queryFn: () => getUserRanks(dbUser!.id),
    enabled: !!dbUser?.id,
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: statues = [], isLoading: statuesLoading, isError: statuesError } = useQuery({
    queryKey: ['statues', dbUser?.id],
    queryFn: () => getUserStatues(dbUser!.id),
    enabled: !!dbUser?.id,
    refetchInterval: 2 * 60 * 1000,
  });

  // Achievement check — cached per user for 5 minutes to prevent flooding the Edge Function
  useQuery({
    queryKey: ['achievements', user?.steamId],
    queryFn: () => Promise.all(games.map(g => checkAchievements(user!.steamId, g.steam_app_id))),
    enabled: !!user && !!dbUser && games.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Invalidates the ranks cache — React Query refetches automatically
  const refreshRanks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ranks', dbUser?.id] });
    queryClient.invalidateQueries({ queryKey: ['statues', dbUser?.id] });
  }, [queryClient, dbUser?.id]);

  const isBanned =
    (dbUser?.is_banned ?? false) &&
    (dbUser?.banned_until === null || dbUser?.banned_until === undefined || new Date(dbUser.banned_until) > new Date());

  return {
    dbUserId: dbUser?.id ?? null,
    dbUsername: dbUser?.username ?? null,
    ranks,
    statues,
    refreshRanks,
    isLoading: !!user && (dbUserLoading || ranksLoading || statuesLoading),
    isError: ranksError || statuesError,
    isBanned,
    banReason: dbUser?.ban_reason ?? null,
    banUntil: dbUser?.banned_until ?? null,
    isAdmin: dbUser?.is_admin ?? false,
    isJudge: dbUser?.is_judge ?? false,
  };
}
