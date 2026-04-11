import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, verifySessionToken } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const ip = getClientIp(req)
    const allowed = await checkRateLimit(supabase, ip, 'profile-action', 20, 60)
    if (!allowed) return rateLimitedResponse(corsHeaders)

    const userId = await verifySessionToken(req, supabase)
    if (!userId) return json({ success: false, error: 'Unauthorized' }, 403)

    const { action, ...payload } = await req.json()

    // Submit judge application
    if (action === 'apply-judge') {
      const { gameId, motivation } = payload
      if (!gameId || !motivation) return json({ success: false, error: 'gameId and motivation required' }, 400)

      const { error } = await supabase.from('judge_applications').insert({
        user_id: userId,
        game_id: gameId,
        motivation,
      })

      if (error) return json({ success: false, error: error.message }, 500)
      return json({ success: true })
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    console.error('profile-action error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
