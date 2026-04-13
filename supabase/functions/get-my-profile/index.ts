import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, verifySessionToken } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const ip = getClientIp(req)
  const allowed = await checkRateLimit(supabase, ip, 'get-my-profile', 60, 60)
  if (!allowed) return rateLimitedResponse(corsHeaders)

  const userId = await verifySessionToken(req, supabase)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const { data, error } = await supabase
    .from('users')
    .select('id, username, steam_id, avatar_url, created_at, is_admin, is_judge, is_banned, ban_reason, banned_until')
    .eq('id', userId)
    .single()

  if (error || !data) return json({ error: 'User not found' }, 404)

  return json(data)
})
