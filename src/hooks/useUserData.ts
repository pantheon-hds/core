import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBySteamId, getUserRanks, getUserStatues, checkAchievements } from '../services/supabase';
import type { SteamUser } from '../components/pages/SteamCallback';
import type { UserRank, UserStatue } from '../types';

interface Game { id: number; steam_app_id: string; title: string; }

interface UseUserDataResult {
  dbUserId: string | null;
  dbUsername: string | null;
  ranks: UserRank[];
  statues: UserStatue[];
  setRanks: React.Dispatch<React.SetStateAction<UserRank[]>>;
  loadUserData: () => Promise<void>;
}

export function useUserData(user: SteamUser | null, games: Game[]): UseUserDataResult {
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [statues, setStatues] = useState<UserStatue[]>([]);

  // Cached: user lookup by steamId
  const { data: dbUser } = useQuery({
    queryKey: ['dbUser', user?.steamId],
    queryFn: () => getUserBySteamId(user!.steamId),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 min — user profile rarely changes
  });

  // Cached: ranks and statues
  const { data: ranksData } = useQuery({
    queryKey: ['ranks', dbUser?.id],
    queryFn: () => getUserRanks(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  const { data: statuesData } = useQuery({
    queryKey: ['statues', dbUser?.id],
    queryFn: () => getUserStatues(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  useEffect(() => { if (ranksData) setRanks(ranksData); }, [ranksData]);
  useEffect(() => { if (statuesData) setStatues(statuesData); }, [statuesData]);

  // Achievement check on load (not cached — always fresh)
  useEffect(() => {
    if (!user || !dbUser || games.length === 0) return;
    Promise.all(games.map(g => checkAchievements(user.steamId, g.steam_app_id)))
      .catch(e => console.error('Failed to check achievements:', e));
  }, [user, dbUser, games]);

  const loadUserData = async () => {
    if (!user || !dbUser) return;
    try {
      const [userRanks, userStatues] = await Promise.all([
        getUserRanks(dbUser.id),
        getUserStatues(dbUser.id),
      ]);
      setRanks(userRanks);
      setStatues(userStatues);
    } catch (e) {
      console.error('Failed to reload user data:', e);
    }
  };

  return {
    dbUserId: dbUser?.id ?? null,
    dbUsername: dbUser?.username ?? null,
    ranks,
    statues,
    setRanks,
    loadUserData,
  };
}
