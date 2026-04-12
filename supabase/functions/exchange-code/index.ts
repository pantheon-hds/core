import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const ip = getClientIp(req)
    const allowed = await checkRateLimit(supabase, ip, 'exchange-code', 10, 60)
    if (!allowed) return rateLimitedResponse(corsHeaders)

    let code: string
    try {
      const body = await req.json()
      code = body.code
    } catch {
      return json({ success: false, error: 'Invalid JSON' }, 400)
    }

    if (!code || typeof code !== 'string') {
      return json({ success: false, error: 'code required' }, 400)
    }

    const { data: authCode, error } = await supabase
      .from('auth_codes')
      .select('user_id, steam_id, username, avatar_url, is_public, token, expires_at, used')
      .eq('code', code)
      .single()

    if (error || !authCode) {
      return json({ success: false, error: 'Invalid code' }, 400)
    }

    if (authCode.used) {
      return json({ success: false, error: 'Code already used' }, 400)
    }

    if (new Date(authCode.expires_at) < new Date()) {
      return json({ success: false, error: 'Code expired' }, 400)
    }

    // Consume the code — mark as used so it cannot be replayed
    await supabase.from('auth_codes').update({ used: true }).eq('code', code)

    return json({
      success: true,
      steamId: authCode.steam_id,
      username: authCode.username,
      avatarUrl: authCode.avatar_url,
      isPublic: authCode.is_public,
      token: authCode.token,
    })
  } catch (err) {
    console.error('exchange-code error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
