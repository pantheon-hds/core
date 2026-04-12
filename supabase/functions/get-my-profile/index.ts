import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, verifySessionToken } from '../_shared/adminGuard.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const token = req.headers.get('x-session-token')
  const secret = Deno.env.get('APP_SESSION_SECRET')
  console.log('token present:', !!token, '| secret present:', !!secret)

  const userId = await verifySessionToken(req, supabase)
  console.log('userId:', userId)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const { data, error } = await supabase
    .from('users')
    .select('id, username, steam_id, avatar_url, created_at, is_admin, is_judge, is_banned, ban_reason, banned_until')
    .eq('id', userId)
    .single()

  if (error || !data) return json({ error: 'User not found' }, 404)

  return json(data)
})
