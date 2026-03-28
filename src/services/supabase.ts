import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface UserRank {
  id: string;
  tier: string;
  method: string;
  granted_at: string;
  game: any;
}

export interface UserStatue {
  id: string;
  tier: string;
  challenge: string;
  is_unique: boolean;
  granted_at: string;
  game: any;
}

export async function getUserRanks(userId: string): Promise<UserRank[]> {
  const { data, error } = await supabase
    .from('ranks')
    .select('id, tier, method, granted_at, game:games(id, title, steam_app_id)')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) { console.error('Error fetching ranks:', error); return []; }
  return (data as any[]) || [];
}

export async function getUserStatues(userId: string): Promise<UserStatue[]> {
  const { data, error } = await supabase
    .from('statues')
    .select('id, tier, challenge, is_unique, granted_at, game:games(title)')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) { console.error('Error fetching statues:', error); return []; }
  return (data as any[]) || [];
}

export async function getUserBySteamId(steamId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('steam_id', steamId)
    .single();

  if (error) { console.error('Error fetching user:', error); return null; }
  return data;
}

export async function checkAchievements(steamId: string, appId: string) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check-achievements`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ steamId, appId }),
    }
  );
  if (!response.ok) return null;
  return response.json();
}

// Check if user meets judge requirements
export async function checkJudgeEligibility(userId: string, steamId: string) {
  // Check if has Gold rank
  const { data: goldRank } = await supabase
    .from('ranks')
    .select('id')
    .eq('user_id', userId)
    .eq('tier', 'Gold')
    .limit(1);

  // Check account age (7 days on platform)
  const { data: user } = await supabase
    .from('users')
    .select('created_at, is_judge')
    .eq('id', userId)
    .single();

  const accountAge = user?.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  // Check existing application
  const { data: existingApp } = await supabase
    .from('judge_applications')
    .select('id, status')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })
    .limit(1);

  return {
    hasGoldRank: (goldRank?.length || 0) > 0,
    accountAgeOk: accountAge >= 7,
    isAlreadyJudge: user?.is_judge || false,
    existingApplication: existingApp?.[0] || null,
    meetsRequirements: (goldRank?.length || 0) > 0 && accountAge >= 7,
  };
}

// Submit judge application
export async function submitJudgeApplication(
  userId: string,
  gameId: number,
  motivation: string
) {
  const { error } = await supabase.from('judge_applications').insert({
    user_id: userId,
    game_id: gameId,
    motivation,
    status: 'pending',
  });
  return !error;
}

// Assign judges to a submission
export async function assignJudges(submissionId: string): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/assign-judges`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submissionId }),
    }
  );
  return response.ok;
}
