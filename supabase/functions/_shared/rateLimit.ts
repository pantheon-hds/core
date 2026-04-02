import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/** Extract real client IP from proxy headers */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}

/**
 * Check rate limit for a given IP + endpoint.
 * Returns true = request is allowed, false = blocked (429).
 * Fails open on DB error so a DB outage never blocks legitimate users.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  ip: string,
  endpoint: string,
  limit: number,
  windowSeconds: number = 60
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_ip: ip,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error(`Rate limit DB error for ${endpoint}:`, error)
    return true // fail open — never block on DB errors
  }

  return data === true
}

/** Standard 429 response */
export function rateLimitedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
