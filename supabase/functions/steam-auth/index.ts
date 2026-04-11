import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'
import { signSessionToken } from '../_shared/adminGuard.ts'

const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://pantheonhds.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/)
  return match ? match[1] : null
}

async function verifySteamLogin(params: URLSearchParams): Promise<boolean> {
  const validationParams = new URLSearchParams(params)
  validationParams.set('openid.mode', 'check_authentication')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: validationParams.toString(),
      signal: controller.signal,
    })
    const text = await response.text()
    return text.includes('is_valid:true')
  } finally {
    clearTimeout(timeout)
  }
}

async function getSteamProfile(steamId: string) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, { signal: controller.signal })
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
  } finally {
    clearTimeout(timeout)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    const ip = getClientIp(req)
    const allowed = await checkRateLimit(supabase, ip, 'steam-auth', 10, 60)
    if (!allowed) return rateLimitedResponse(corsHeaders)

    const url = new URL(req.url)
    const params = url.searchParams

    const claimedId = params.get('openid.claimed_id')
    if (!claimedId) {
      return new Response(
        JSON.stringify({ error: 'No Steam ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const steamId = extractSteamId(claimedId)
    if (!steamId) {
      return new Response(
        JSON.stringify({ error: 'Invalid Steam ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isValid = await verifySteamLogin(params)
    if (!isValid) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${APP_URL}/app?error=auth_failed` }
      })
    }

    const profile = await getSteamProfile(steamId)
    if (!profile) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${APP_URL}/app?error=profile_failed` }
      })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('steam_id', steamId)
      .single()

    let userId: string

    if (!existingUser) {
      // New user — require a valid invite nonce from the OAuth flow
      const inviteNonce = url.searchParams.get('invite_nonce')

      if (!inviteNonce) {
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${APP_URL}/beta?reason=no_access` }
        })
      }

      const { data: invite } = await supabase
        .from('invite_codes')
        .select('id, used_at')
        .eq('nonce', inviteNonce)
        .eq('used', false)
        .single()

      if (!invite) {
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${APP_URL}/beta?reason=no_access` }
        })
      }

      // Nonce expires after 1 hour
      const usedAt = new Date(invite.used_at)
      if (Date.now() - usedAt.getTime() > 60 * 60 * 1000) {
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${APP_URL}/beta?reason=no_access` }
        })
      }

      // Consume the nonce — mark as fully used so it can't be reused
      await supabase
        .from('invite_codes')
        .update({ nonce: null, used: true })
        .eq('id', invite.id)

      const { data: inserted } = await supabase.from('users').insert({
        steam_id: steamId,
        username: profile.username,
        avatar_url: profile.avatarUrl,
        profile_url: profile.profileUrl,
      }).select('id').single()
      userId = inserted!.id
    } else {
      await supabase.from('users').update({
        username: profile.username,
        avatar_url: profile.avatarUrl,
      }).eq('steam_id', steamId)
      userId = existingUser.id
    }

    const token = await signSessionToken(userId)

    // Redirect to /app with user data + signed session token
    const redirectUrl = `${APP_URL}/app?steamId=${steamId}&username=${encodeURIComponent(profile.username)}&avatar=${encodeURIComponent(profile.avatarUrl)}&public=${profile.isPublic}&token=${encodeURIComponent(token)}`

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: redirectUrl }
    })

  } catch (error) {
    console.error('Steam auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
