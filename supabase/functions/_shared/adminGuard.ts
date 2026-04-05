import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── JWT helpers (pure Web Crypto — no external deps) ──────────────────────────

function toBase64url(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4)
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

let _signingKey: CryptoKey | null = null

async function getSigningKey(): Promise<CryptoKey> {
  if (_signingKey) return _signingKey
  const secret = Deno.env.get('APP_SESSION_SECRET')
  if (!secret) throw new Error('APP_SESSION_SECRET is not configured')
  _signingKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  return _signingKey
}

const JWT_HEADER = toBase64url(
  new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
)

/**
 * Signs a 30-day session JWT for the given DB user ID.
 * Called server-side after successful Steam OAuth or founder login.
 */
export async function signSessionToken(userId: string): Promise<string> {
  const key = await getSigningKey()
  const now = Math.floor(Date.now() / 1000)
  const jti = toBase64url(crypto.getRandomValues(new Uint8Array(16)))
  const payload = toBase64url(
    new TextEncoder().encode(JSON.stringify({
      sub: userId,
      jti,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }))
  )
  const message = `${JWT_HEADER}.${payload}`
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return `${message}.${toBase64url(new Uint8Array(sigBytes))}`
}

/**
 * Verifies the session JWT from the x-session-token request header.
 * Optionally checks against revoked_tokens table when supabase client is provided.
 * Returns the user DB ID (sub claim) on success, null on any failure.
 */
export async function verifySessionToken(
  req: Request,
  supabase?: SupabaseClient
): Promise<string | null> {
  const token = req.headers.get('x-session-token')
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, sigB64] = parts
  const message = `${headerB64}.${payloadB64}`

  try {
    const key = await getSigningKey()
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      fromBase64url(sigB64),
      new TextEncoder().encode(message)
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(payloadB64)))
    const now = Math.floor(Date.now() / 1000)
    if (!payload.sub || !payload.exp || payload.exp < now) return null

    // Check revocation list if supabase client provided
    if (supabase && payload.jti) {
      const { data } = await supabase
        .from('revoked_tokens')
        .select('jti')
        .eq('jti', payload.jti)
        .maybeSingle()
      if (data) return null
    }

    return payload.sub as string
  } catch {
    return null
  }
}

/**
 * Revokes a session token by inserting its jti into revoked_tokens.
 * Call this on logout.
 */
export async function revokeSessionToken(
  token: string,
  supabase: SupabaseClient
): Promise<void> {
  const parts = token.split('.')
  if (parts.length !== 3) return
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(parts[1])))
    if (payload.jti) {
      await supabase.from('revoked_tokens').insert({ jti: payload.jti })
    }
  } catch {
    // ignore
  }
}

/**
 * Verifies the session token and checks is_admin by user UUID.
 * Returns the userId on success, null on any failure or if not admin.
 */
export async function requireAdmin(req: Request, supabase: SupabaseClient): Promise<string | null> {
  const userId = await verifySessionToken(req, supabase)
  if (!userId) return null

  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return data?.is_admin === true ? userId : null
}
