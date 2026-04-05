import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Verifies the caller is an admin by looking up their Steam ID in the DB.
 * Uses the service role client — cannot be bypassed by client-side manipulation.
 */
export async function verifyAdmin(supabase: SupabaseClient, steamId: string): Promise<boolean> {
  if (!steamId) return false
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('steam_id', steamId)
    .single()
  return data?.is_admin === true
}
