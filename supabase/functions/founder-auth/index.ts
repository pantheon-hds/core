import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { signSessionToken } from '../_shared/adminGuard.ts'

const FOUNDER_PASSWORD = Deno.env.get('FOUNDER_PASSWORD')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// In-memory rate limiting (resets on function restart but good enough)
const attempts: Record<string, { count: number; blockedUntil: number }> = {}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 6 * 60 * 60 * 1000 // 6 hours

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = getClientIP(req)
  const now = Date.now()

  // Check if blocked
  if (attempts[ip]) {
    if (attempts[ip].blockedUntil > now) {
      const minutesLeft = Math.ceil((attempts[ip].blockedUntil - now) / 60000)
      return new Response(
        JSON.stringify({ error: `Too many attempts. Try again in ${minutesLeft} minutes.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (attempts[ip].blockedUntil <= now) {
      // Block expired — reset
      delete attempts[ip]
    }
  }

  try {
    const { password } = await req.json()

    if (!password || password !== FOUNDER_PASSWORD) {
      // Track failed attempt
      if (!attempts[ip]) {
        attempts[ip] = { count: 0, blockedUntil: 0 }
      }
      attempts[ip].count += 1

      if (attempts[ip].count >= MAX_ATTEMPTS) {
        attempts[ip].blockedUntil = now + BLOCK_DURATION_MS
        return new Response(
          JSON.stringify({ error: 'Too many attempts. Blocked for 6 hours.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const remaining = MAX_ATTEMPTS - attempts[ip].count
      return new Response(
        JSON.stringify({ error: `Invalid password. ${remaining} attempts remaining.` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Success — reset attempts
    delete attempts[ip]

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    const { data: founder } = await supabase
      .from('users')
      .select('*')
      .eq('steam_id', 'VOLAND_FOUNDER')
      .single()

    if (!founder) {
      return new Response(
        JSON.stringify({ error: 'Founder account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = await signSessionToken(founder.id)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          steamId: 'VOLAND_FOUNDER',
          username: 'Voland',
          avatarUrl: '',
          isPublic: true,
          isFounder: true,
          token,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
