import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, verifySessionToken } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'
import { makeLogger } from '../_shared/logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const reqId = crypto.randomUUID()
  const log = makeLogger('submit-challenge', reqId)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const ip = getClientIp(req)
    log.info('request received', { ip, method: req.method })

    const allowed = await checkRateLimit(supabase, ip, 'submit-challenge', 10, 60)
    if (!allowed) {
      log.warn('rate limited', { ip })
      return rateLimitedResponse(corsHeaders)
    }

    const userId = await verifySessionToken(req, supabase)
    if (!userId) {
      log.warn('unauthorized', { ip })
      return json({ success: false, error: 'Unauthorized' }, 403)
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json({ success: false, error: 'Invalid JSON' }, 400)
    }
    const { action, challengeId, videoUrl, comment } = body as {
      action?: string; challengeId?: number; videoUrl?: string; comment?: string
    }

    // GET my submissions
    if (action === 'list') {
      const { data } = await supabase
        .from('submissions')
        .select('id, challenge_id, status, cooldown_until')
        .eq('user_id', userId)
      return json({ success: true, submissions: data ?? [] })
    }

    // WITHDRAW a submission
    if (action === 'withdraw') {
      const { submissionId } = body
      if (!submissionId) return json({ success: false, error: 'submissionId required' }, 400)

      // Verify this submission belongs to the user
      const { data: sub } = await supabase
        .from('submissions')
        .select('id, status')
        .eq('id', submissionId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!sub) return json({ success: false, error: 'Submission not found' }, 404)
      if (sub.status !== 'pending' && sub.status !== 'in_review') {
        return json({ success: false, error: 'Cannot withdraw this submission' }, 400)
      }

      const cooldownUntil = new Date()
      cooldownUntil.setHours(cooldownUntil.getHours() + 24)

      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString(),
          cooldown_until: cooldownUntil.toISOString(),
        })
        .eq('id', submissionId)

      if (error) return json({ success: false, error: error.message }, 500)
      return json({ success: true })
    }

    if (!challengeId || !videoUrl) return json({ success: false, error: 'challengeId and videoUrl required' }, 400)

    // Validate videoUrl — only YouTube and Twitch allowed.
    // Must stay in sync with isValidVideoUrl() in src/utils/videoUrl.ts
    const ALLOWED_DOMAINS = ['youtube.com', 'youtu.be', 'twitch.tv']
    const isValidVideo = (url: string) => {
      try {
        const { hostname, protocol } = new URL(url)
        if (protocol !== 'https:') return false
        const domain = hostname.replace(/^www\./, '')
        return ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))
      } catch { return false }
    }
    if (!isValidVideo(videoUrl)) {
      return json({ success: false, error: 'Only YouTube or Twitch links are allowed.' }, 400)
    }

    // Check for active submission
    const { data: active } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_review'])
      .maybeSingle()

    if (active) {
      log.warn('blocked: active submission exists', { userId })
      return json({ success: false, error: 'You already have an active submission. Wait for the result.' }, 400)
    }

    // Check cooldown
    const { data: cooldownRow } = await supabase
      .from('submissions')
      .select('cooldown_until')
      .eq('user_id', userId)
      .not('cooldown_until', 'is', null)
      .order('cooldown_until', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cooldownRow?.cooldown_until && new Date(cooldownRow.cooldown_until) > new Date()) {
      log.warn('blocked: on cooldown', { userId, cooldownUntil: cooldownRow.cooldown_until })
      return json({ success: false, error: 'You are on cooldown. Please wait 24 hours after withdrawing.' }, 400)
    }

    const { data: inserted, error } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        video_url: videoUrl,
        comment: comment ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      log.error('insert failed', { userId, challengeId, error: error.message })
      return json({ success: false, error: error.message }, 500)
    }

    log.info('submission created', { userId, challengeId, submissionId: inserted.id })
    return json({ success: true, submissionId: inserted.id })

  } catch (err) {
    log.error('unhandled exception', { error: (err as Error).message })
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
