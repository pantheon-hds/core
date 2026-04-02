import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Must stay in sync with determineRank() in src/services/steamApi.ts
function getTier(percentage: number): string | null {
  if (percentage === 100) return 'Gold'
  if (percentage >= 95) return 'Silver III'
  if (percentage >= 90) return 'Silver II'
  if (percentage >= 75) return 'Silver I'
  if (percentage >= 50) return 'Bronze III'
  if (percentage >= 25) return 'Bronze II'
  if (percentage >= 1)  return 'Bronze I'
  return null // 0% achievements — no rank granted
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    const ip = getClientIp(req)
    const allowed = await checkRateLimit(supabase, ip, 'check-achievements', 20, 60)
    if (!allowed) return rateLimitedResponse(corsHeaders)

    let steamId: string
    let appId: string

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      steamId = body.steamId
      appId = body.appId
    } else {
      const url = new URL(req.url)
      steamId = url.searchParams.get('steamId') || ''
      appId = url.searchParams.get('appId') || ''
    }

    if (!steamId || !appId) {
      return new Response(
        JSON.stringify({ error: 'steamId and appId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Checking steamId: ${steamId}, appId: ${appId}`)

    const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${appId}&l=english`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.playerstats?.success) {
      return new Response(
        JSON.stringify({ error: 'Could not fetch achievements', appId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const achievements: { achieved: number }[] = data.playerstats.achievements || []
    const total = achievements.length
    const unlocked = achievements.filter(a => a.achieved === 1).length
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0
    const tier = getTier(percentage)

    console.log(`${appId}: ${unlocked}/${total} = ${percentage}% → ${tier}`)

    if (tier) {

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .single()

      if (user) {
        const { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('steam_app_id', appId)
          .single()

        if (game) {
          const { data: existingRank } = await supabase
            .from('ranks')
            .select('id, tier, method')
            .eq('user_id', user.id)
            .eq('game_id', game.id)
            .single()

          const statueChallenge = `${percentage}% Steam Achievements`

          if (!existingRank) {
            // First time seeing this user+game — create rank and statue
            await supabase.from('ranks').upsert({
              user_id: user.id,
              game_id: game.id,
              tier,
              method: 'steam_auto',
            }, { onConflict: 'user_id,game_id' })

            await supabase.from('statues').upsert({
              user_id: user.id,
              game_id: game.id,
              tier,
              challenge: statueChallenge,
              is_unique: false,
            }, { onConflict: 'user_id,game_id' })

          } else if (existingRank.method !== 'community_verified' && existingRank.tier !== tier) {
            // Steam rank improved — update both rank and statue
            await supabase.from('ranks')
              .update({ tier, method: 'steam_auto' })
              .eq('id', existingRank.id)

            await supabase.from('statues')
              .update({ tier, challenge: statueChallenge })
              .eq('user_id', user.id)
              .eq('game_id', game.id)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ steamId, appId, total, unlocked, percentage, tier }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
