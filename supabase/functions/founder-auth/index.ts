import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { signSessionToken, corsHeaders, json } from '../_shared/adminGuard.ts'
import { checkRateLimit, getClientIp, rateLimitedResponse } from '../_shared/rateLimit.ts'

const FOUNDER_PASSWORD = Deno.env.get('FOUNDER_PASSWORD')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    const ip = getClientIp(req)

    // DB-backed rate limiting — 5 attempts per 6 hours, survives function restarts
    const allowed = await checkRateLimit(supabase, ip, 'founder-auth', 5, 6 * 60 * 60)
    if (!allowed) return rateLimitedResponse(corsHeaders)

    const { password } = await req.json()

    // Constant-time comparison to prevent timing-based password discovery
    const safeCompare = (a: string, b: string): boolean => {
      const aBytes = new TextEncoder().encode(a)
      const bBytes = new TextEncoder().encode(b)
      if (aBytes.length !== bBytes.length) return false
      let diff = 0
      for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i]
      return diff === 0
    }

    if (!password || !FOUNDER_PASSWORD || !safeCompare(password, FOUNDER_PASSWORD)) {
      return json({ error: 'Invalid password.' }, 401)
    }

    const { data: founder } = await supabase
      .from('users')
      .select('id')
      .eq('steam_id', 'VOLAND_FOUNDER')
      .single()

    if (!founder) {
      return json({ error: 'Founder account not found' }, 404)
    }

    const token = await signSessionToken(founder.id)

    return json({
      success: true,
      user: {
        steamId: 'VOLAND_FOUNDER',
        username: 'Voland',
        avatarUrl: '',
        isPublic: true,
        isFounder: true,
        token,
      }
    })

  } catch (error) {
    return json({ error: 'Internal error' }, 500)
  }
})
