import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Extract Steam ID from OpenID response
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/)
  return match ? match[1] : null
}

// Verify Steam OpenID response
async function verifySteamLogin(params: URLSearchParams): Promise<boolean> {
  const validationParams = new URLSearchParams(params)
  validationParams.set('openid.mode', 'check_authentication')

  const response = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: validationParams.toString(),
  })

  const text = await response.text()
  return text.includes('is_valid:true')
}

// Get Steam profile
async function getSteamProfile(steamId: string) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
  const response = await fetch(url)
  const data = await response.json()

  if (!data.response?.players?.length) return null

  const player = data.response.players[0]
  return {
    steamId: player.steamid,
    username: player.personaname,
    avatarUrl: player.avatarfull,
    profileUrl: player.profileurl,
    isPublic: player.communityvisibilitystate === 3,
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  const params = url.searchParams

  // Handle Steam OpenID callback
  const claimedId = params.get('openid.claimed_id')
  if (!claimedId) {
    return new Response(JSON.stringify({ error: 'No Steam ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const steamId = extractSteamId(claimedId)
  if (!steamId) {
    return new Response(JSON.stringify({ error: 'Invalid Steam ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify with Steam
  const isValid = await verifySteamLogin(params)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Steam verification failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get Steam profile
  const profile = await getSteamProfile(steamId)
  if (!profile) {
    return new Response(JSON.stringify({ error: 'Could not fetch Steam profile' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Save or update user in Supabase
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('steam_id', steamId)
    .single()

  if (!existingUser) {
    await supabase.from('users').insert({
      steam_id: steamId,
      username: profile.username,
      avatar_url: profile.avatarUrl,
      profile_url: profile.profileUrl,
    })
  } else {
    await supabase.from('users').update({
      username: profile.username,
      avatar_url: profile.avatarUrl,
    }).eq('steam_id', steamId)
  }

  // Redirect back to app with Steam ID
  const redirectUrl = `${Deno.env.get('APP_URL')}?steamId=${steamId}&username=${encodeURIComponent(profile.username)}&avatar=${encodeURIComponent(profile.avatarUrl)}&public=${profile.isPublic}`

  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl },
  })
})
