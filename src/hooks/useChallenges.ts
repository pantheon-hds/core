import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { Challenge } from '../types';

interface Game { id: number; steam_app_id: string; title: string; }

async function fetchChallenges(): Promise<Challenge[]> {
  const { data } = await supabase
    .from('challenges')
    .select('*, game:games(id, title)')
    .order('tier', { ascending: true });
  return (data as Challenge[]) || [];
}

async function fetchGames(): Promise<Game[]> {
  const { data } = await supabase
    .from('games')
    .select('id, steam_app_id, title')
    .eq('active', true);
  return data || [];
}

export function useChallenges() {
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges'], queryFn: fetchChallenges });
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  return { challenges, games };
}
