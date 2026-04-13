import { supabase } from './supabase';
import type { Challenge } from '../types';

interface Game { id: number; steam_app_id: string; title: string; }

export async function fetchChallenges(): Promise<Challenge[]> {
  const { data } = await supabase
    .from('challenges')
    .select('*, game:games(id, title)')
    .order('tier', { ascending: true });
  return Array.isArray(data) ? (data as Challenge[]) : [];
}

export async function fetchGames(): Promise<Game[]> {
  const { data } = await supabase
    .from('games')
    .select('id, steam_app_id, title')
    .eq('active', true);
  return data || [];
}
