import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Determine rank based on achievement percentage
function determineRank(percentage: number): string {
  if (percentage === 100) return 'Gold'
  if (percentage >= 95) return 'Silver'
  if (percentage >= 75) return 'Silver'
  if (percentage >= 50) return 'Bronze'
  if (percentage >= 25) return 'Bronze'
  return 'Bronze'
}

function determineDegree(percentage: number): string {
  if (percentage === 100) return 'I'
  if (percentage >= 95) return 'III'
  if (percentage >= 90) return 'II'
  if (percentage >= 75) return 'I'
  if (percentage >= 50) return 'III'
  if (percentage >= 25) return 'II'
  return 'I'
}

serve(async (req) => {
  const { steamId, appId } = await req.json()

  if (!steamId || !appId) {
    return new Response(
      JSON.stringify({ error: 'steamId and appId are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get achievements from Steam API
    const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${appId}&l=english`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.playerstats?.success) {
      return new Response(
        JSON.stringify({
          error: 'Could not fetch achievements. Make sure your Steam profile is public.',
          isPublic: false,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const achievements = data.playerstats.achievements || []
    const total = achievements.length
    const unlocked = achievements.filter((a: any) => a.achieved === 1).length
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0
    const isGold = percentage === 100

    // If Gold — save rank to Supabase
    if (isGold) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

      // Get user by steam ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .single()

      if (user) {
        // Get game by app ID
        const { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('steam_app_id', appId)
          .single()

        if (game) {
          // Check if Gold rank already exists
          const { data: existingRank } = await supabase
            .from('ranks')
            .select('id')
            .eq('user_id', user.id)
            .eq('game_id', game.id)
            .eq('tier', 'Gold')
            .single()

          if (!existingRank) {
            // Assign Gold rank
            await supabase.from('ranks').insert({
              user_id: user.id,
              game_id: game.id,
              tier: 'Gold',
              method: 'steam_auto',
            })

            // Assign Gold statue
            await supabase.from('statues').insert({
              user_id: user.id,
              game_id: game.id,
              tier: 'Gold',
              challenge: '100% Steam Achievements',
              is_unique: false,
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        steamId,
        appId,
        total,
        unlocked,
        percentage,
        isGold,
        rank: determineRank(percentage),
        degree: determineDegree(percentage),
        rankFull: `${determineRank(percentage)} ${determineDegree(percentage)}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Steam API error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
