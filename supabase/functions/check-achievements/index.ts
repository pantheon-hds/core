import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse body safely
    let steamId: string
    let appId: string

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await req.json()
      steamId = body.steamId
      appId = body.appId
    } else {
      // Try URL params as fallback
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

    console.log(`Checking achievements for steamId: ${steamId}, appId: ${appId}`)

    // Get achievements from Steam API
    const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${appId}&l=english`
    const response = await fetch(url)
    const data = await response.json()

    console.log('Steam API response:', JSON.stringify(data).slice(0, 200))

    if (!data.playerstats?.success) {
      return new Response(
        JSON.stringify({
          error: 'Could not fetch achievements. Make sure your Steam profile is public.',
          steamResponse: data,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const achievements = data.playerstats.achievements || []
    const total = achievements.length
    const unlocked = achievements.filter((a: any) => a.achieved === 1).length
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0
    const isGold = percentage === 100

    console.log(`Total: ${total}, Unlocked: ${unlocked}, Percentage: ${percentage}%, Gold: ${isGold}`)

    if (isGold) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .single()

      console.log('User found:', user)

      if (user) {
        const { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('steam_app_id', appId)
          .single()

        console.log('Game found:', game)

        if (game) {
          const { data: existingRank } = await supabase
            .from('ranks')
            .select('id')
            .eq('user_id', user.id)
            .eq('game_id', game.id)
            .eq('tier', 'Gold')
            .single()

          if (!existingRank) {
            const { error: rankError } = await supabase.from('ranks').insert({
              user_id: user.id,
              game_id: game.id,
              tier: 'Gold',
              method: 'steam_auto',
            })
            console.log('Rank insert error:', rankError)

            const { error: statueError } = await supabase.from('statues').insert({
              user_id: user.id,
              game_id: game.id,
              tier: 'Gold',
              challenge: '100% Steam Achievements',
              is_unique: false,
            })
            console.log('Statue insert error:', statueError)
          } else {
            console.log('Gold rank already exists')
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
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
