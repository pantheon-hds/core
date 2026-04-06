import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserBySteamId, getUserRanks, getUserStatues, checkAchievements } from '../services/supabase';
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
}

export function useUserData(user: SteamUser | null, games: Game[]): UseUserDataResult {
  const queryClient = useQueryClient();

  const { data: dbUser, isLoading: dbUserLoading } = useQuery({
    queryKey: ['dbUser', user?.steamId],
    queryFn: () => getUserBySteamId(user!.steamId),
    enabled: !!user,
    staleTime: 30 * 1000, // 30s — short so bans take effect quickly
  });

  const { data: ranks = [], isLoading: ranksLoading, isError: ranksError } = useQuery({
    queryKey: ['ranks', dbUser?.id],
    queryFn: () => getUserRanks(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  const { data: statues = [], isLoading: statuesLoading, isError: statuesError } = useQuery({
    queryKey: ['statues', dbUser?.id],
    queryFn: () => getUserStatues(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  // Achievement check on load (not cached — always fresh)
  useEffect(() => {
    if (!user || !dbUser || games.length === 0) return;
    Promise.all(games.map(g => checkAchievements(user.steamId, g.steam_app_id)))
      .catch(e => console.error('Failed to check achievements:', e));
  }, [user, dbUser, games]);

  // Invalidates the ranks cache — React Query refetches automatically
  const refreshRanks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ranks', dbUser?.id] });
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
  };
}
