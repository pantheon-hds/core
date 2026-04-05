import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, revokeSessionToken } from '../_shared/adminGuard.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = req.headers.get('x-session-token')
    if (!token) return json({ success: true }) // already logged out

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await revokeSessionToken(token, supabase)

    return json({ success: true })
  } catch {
    return json({ success: true }) // logout should never fail visibly
  }
})
