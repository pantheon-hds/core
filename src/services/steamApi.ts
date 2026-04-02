import type { RankTier } from '../constants/ranks';

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_API_BASE = 'https://api.steampowered.com';

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
}

export interface AchievementResult {
  steamId: string;
  appId: string;
  total: number;
  unlocked: number;
  percentage: number;
  isGold: boolean;
}

export async function getPlayerAchievements(
  steamId: string,
  appId: string
): Promise<AchievementResult | null> {
  try {
    const url = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${appId}&l=english`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.playerstats || !data.playerstats.success) {
      return null;
    }

    const achievements: SteamAchievement[] = data.playerstats.achievements || [];
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.achieved === 1).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return {
      steamId,
      appId,
      total,
      unlocked,
      percentage,
      isGold: percentage === 100,
    };
  } catch (error) {
    console.error('Steam API error:', error);
    return null;
  }
}

export async function getSteamProfile(steamId: string) {
  try {
    const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.response || !data.response.players || data.response.players.length === 0) {
      return null;
    }

    const player = data.response.players[0];

    return {
      steamId: player.steamid,
      username: player.personaname,
      avatarUrl: player.avatarfull,
      profileUrl: player.profileurl,
      isPublic: player.communityvisibilitystate === 3,
    };
  } catch (error) {
    console.error('Steam profile error:', error);
    return null;
  }
}

// Determine rank based on achievement percentage
export function determineRank(percentage: number): RankTier {
  if (percentage === 100) return 'Gold';
  if (percentage >= 95) return 'Silver III';
  if (percentage >= 90) return 'Silver II';
  if (percentage >= 75) return 'Silver I';
  if (percentage >= 50) return 'Bronze III';
  if (percentage >= 25) return 'Bronze II';
  return 'Bronze I';
}
