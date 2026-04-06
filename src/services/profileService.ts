import { supabase } from './supabase';

export interface PublicProfileData {
  username: string;
  avatarUrl: string | null;
  steamId: string;
  createdAt: string;
  ranks: { tier: string; gameTitle: string; grantedAt: string }[];
  statues: { id: string; tier: string; gameTitle: string; isUnique: boolean; grantedAt: string }[];
}

export async function getPublicProfile(username: string): Promise<PublicProfileData | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, steam_id, created_at')
    .eq('username', username)
    .single();

  if (error || !user) return null;

  const [{ data: ranks }, { data: statues }] = await Promise.all([
    supabase
      .from('ranks')
      .select('tier, granted_at, game:games(title)')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false }),
    supabase
      .from('statues')
      .select('id, tier, is_unique, granted_at, game:games(title)')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false }),
  ]);

  type RankRow = { tier: string; granted_at: string; game: { title: string } | null };
  type StatueRow = { id: string; tier: string; is_unique: boolean | null; granted_at: string; game: { title: string } | null };

  return {
    username: user.username,
    avatarUrl: user.avatar_url,
    steamId: user.steam_id,
    createdAt: user.created_at ?? '',
    ranks: ((ranks as RankRow[]) || []).map(r => ({
      tier: r.tier,
      gameTitle: r.game?.title ?? '—',
      grantedAt: r.granted_at,
    })),
    statues: ((statues as StatueRow[]) || []).map(s => ({
      id: s.id,
      tier: s.tier,
      gameTitle: s.game?.title ?? '—',
      isUnique: s.is_unique ?? false,
      grantedAt: s.granted_at,
    })),
  };
}
