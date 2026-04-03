import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Challenge } from '../types';

interface Game { id: number; steam_app_id: string; title: string; }

interface UseChallengesResult {
  challenges: Challenge[];
  games: Game[];
}

export function useChallenges(): UseChallengesResult {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [games, setGames] = useState<Game[]>([]);

  const loadChallenges = useCallback(async () => {
    const { data } = await supabase
      .from('challenges')
      .select('*, game:games(id, title)')
      .order('tier', { ascending: true });
    setChallenges((data as Challenge[]) || []);
  }, []);

  const loadGames = useCallback(async () => {
    const { data } = await supabase
      .from('games')
      .select('id, steam_app_id, title')
      .eq('active', true);
    setGames(data || []);
  }, []);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);
  useEffect(() => { loadGames(); }, [loadGames]);

  return { challenges, games };
}
