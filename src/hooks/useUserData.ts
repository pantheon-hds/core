import { useState, useCallback, useEffect } from 'react';
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
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [dbUsername, setDbUsername] = useState<string | null>(null);
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [statues, setStatues] = useState<UserStatue[]>([]);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    try {
      const dbUser = await getUserBySteamId(user.steamId);
      if (dbUser) {
        setDbUserId(dbUser.id);
        setDbUsername(dbUser.username);
        await Promise.all(games.map(g => checkAchievements(user.steamId, g.steam_app_id)));
        const [userRanks, userStatues] = await Promise.all([
          getUserRanks(dbUser.id),
          getUserStatues(dbUser.id),
        ]);
        setRanks(userRanks);
        setStatues(userStatues);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
  }, [user, games]);

  useEffect(() => {
    if (user && games.length > 0) loadUserData();
  }, [user, games, loadUserData]);

  return { dbUserId, dbUsername, ranks, statues, setRanks, loadUserData };
}
