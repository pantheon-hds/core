import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, verifySessionToken } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'
import { makeLogger } from '../_shared/logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Fisher-Yates shuffle — uniform distribution, unlike sort(() => Math.random() - 0.5)
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const reqId = crypto.randomUUID()
  const log = makeLogger('assign-judges', reqId)

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    const ip = getClientIp(req)
    log.info('request received', { ip, method: req.method })

    const allowed = await checkRateLimit(supabase, ip, 'assign-judges', 10, 60)
    if (!allowed) {
      log.warn('rate limited', { ip })
      return rateLimitedResponse(corsHeaders)
    }

    const callerId = await verifySessionToken(req, supabase)
    if (!callerId) {
      log.warn('unauthorized', { ip })
      return json({ error: 'Unauthorized' }, 401)
    }

    const { submissionId } = await req.json()

    if (!submissionId) return json({ error: 'submissionId required' }, 400)

    const { data: submission } = await supabase
      .from('submissions')
      .select('*, challenge:challenges(game_id), user_id')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      log.warn('submission not found', { submissionId })
      return json({ error: 'Submission not found' }, 404)
    }

    // Verify the caller owns this submission — prevents hijacking another user's submission
    if (submission.user_id !== callerId) {
      log.warn('forbidden: caller does not own submission', { callerId, submissionId })
      return json({ error: 'Forbidden' }, 403)
    }

    // Idempotency: if judges are already assigned, return success without creating duplicates
    const { data: existingJudges } = await supabase
      .from('submission_judges')
      .select('judge_user_id')
      .eq('submission_id', submissionId)

    if (existingJudges && existingJudges.length > 0) {
      log.info('judges already assigned, idempotent return', { submissionId, count: existingJudges.length })
      return json({ success: true, judgesAssigned: existingJudges.length, alreadyAssigned: true })
    }

    const gameId = submission.challenge?.game_id
    const submitterUserId = submission.user_id

    // Find eligible judges: is_judge=true, has rank in this game, not the submitter
    const { data: rankedUserIds } = await supabase
      .from('ranks')
      .select('user_id')
      .eq('game_id', gameId)

    const rankedIds = (rankedUserIds || []).map((r: { user_id: string }) => r.user_id)

    const fallbackResponse = (message: string) => {
      log.warn('falling back to admin review', { submissionId, reason: message })
      return json({ success: true, judgesAssigned: 0, message })
    }

    if (rankedIds.length === 0) {
      return fallbackResponse('No eligible judges — admin will review manually')
    }

    const { data: eligibleJudgesRaw } = await supabase
      .from('users')
      .select('id')
      .eq('is_judge', true)
      .neq('id', submitterUserId)
      .in('id', rankedIds)

    const eligibleJudges = (eligibleJudgesRaw || []) as { id: string }[]

    // Need at least 2 judges for a fair vote; otherwise Voland reviews manually
    if (eligibleJudges.length < 2) {
      return fallbackResponse(`Only ${eligibleJudges.length} eligible judge(s) — admin will review manually`)
    }

    // Select up to 3 judges (2 or 3 depending on availability)
    const selected = shuffleArray(eligibleJudges).slice(0, 3)

    const { error: assignError } = await supabase
      .from('submission_judges')
      .insert(selected.map(judge => ({
        submission_id: submissionId,
        judge_user_id: judge.id,
      })))

    if (assignError) {
      log.error('failed to insert judges', { submissionId, error: assignError.message })
      return json({ error: assignError.message }, 500)
    }

    const { error: statusError } = await supabase
      .from('submissions')
      .update({ status: 'in_review' })
      .eq('id', submissionId)

    if (statusError) {
      // Judges are assigned — don't fail the whole request
      log.warn('failed to set submission status to in_review', { submissionId, error: statusError.message })
    }

    log.info('judges assigned', { submissionId, count: selected.length })
    return json({ success: true, judgesAssigned: selected.length })

  } catch (error) {
    log.error('unhandled exception', { error: (error as Error).message })
    return json({ error: 'Internal error' }, 500)
  }
})
