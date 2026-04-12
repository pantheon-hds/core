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

    let action: string, payload: Record<string, unknown>
    try {
      const body = await req.json()
      action = body.action
      const { action: _, ...rest } = body
      payload = rest
    } catch {
      return json({ success: false, error: 'Invalid JSON' }, 400)
    }

    // Submit judge application
    if (action === 'apply-judge') {
      const { gameId, motivation } = payload as { gameId?: unknown; motivation?: string }
      if (!gameId || !motivation) return json({ success: false, error: 'gameId and motivation required' }, 400)
      const gameIdNum = Number(gameId)
      if (!Number.isInteger(gameIdNum) || gameIdNum <= 0) {
        return json({ success: false, error: 'Invalid gameId' }, 400)
      }
      if (typeof motivation !== 'string' || motivation.trim().length < 10 || motivation.length > 1000) {
        return json({ success: false, error: 'Motivation must be between 10 and 1000 characters' }, 400)
      }

      const { error } = await supabase.from('judge_applications').insert({
        user_id: userId,
        game_id: gameIdNum,
        motivation,
      })

      if (error) return json({ success: false, error: error.message }, 500)
      return json({ success: true })
    }

    // List judge assignments for current user
    if (action === 'list-judge-assignments') {
      const { data, error } = await supabase
        .from('submission_judges')
        .select(`id, assigned_at, vote, timestamp_note,
          submission:submissions(
            id, video_url, comment, submitted_at,
            user:users(username),
            challenge:challenges(title, tier, description)
          )`)
        .eq('judge_user_id', userId)
        .order('assigned_at', { ascending: false })
      if (error) return json({ success: false, error: error.message }, 500)
      return json({ success: true, data })
    }

    // Record a judge vote and finalise submission if majority reached
    if (action === 'record-judge-vote') {
      const { assignmentId, submissionId, vote, timestampNote } = payload
      if (!assignmentId || !submissionId || !vote || !timestampNote) {
        return json({ success: false, error: 'assignmentId, submissionId, vote and timestampNote required' }, 400)
      }

      // Verify this assignment belongs to the current judge
      const { data: assignment } = await supabase
        .from('submission_judges')
        .select('id, judge_user_id')
        .eq('id', assignmentId)
        .eq('judge_user_id', userId)
        .maybeSingle()

      if (!assignment) return json({ success: false, error: 'Assignment not found or not yours' }, 403)

      // Record the vote
      const { error: voteError } = await supabase
        .from('submission_judges')
        .update({ vote, timestamp_note: timestampNote, voted_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (voteError) return json({ success: false, error: voteError.message }, 500)

      // Check all votes for this submission
      const { data: allVotes } = await supabase
        .from('submission_judges')
        .select('vote')
        .eq('submission_id', submissionId)

      if (!allVotes) return json({ success: true, finalised: false })

      const totalJudges = allVotes.length
      const votedCount = allVotes.filter((v: { vote: string | null }) => v.vote !== null).length
      const approvedVotes = allVotes.filter((v: { vote: string | null }) => v.vote === 'approved').length
      const rejectedVotes = allVotes.filter((v: { vote: string | null }) => v.vote === 'rejected').length

      let finalStatus: string | null = null

      if (totalJudges === 3) {
        // 3 judges: early finalisation as soon as 2/3 agree
        if (approvedVotes >= 2) finalStatus = 'approved'
        else if (rejectedVotes >= 2) finalStatus = 'rejected'
      } else if (totalJudges === 2) {
        // 2 judges: wait for both to vote
        if (votedCount < 2) return json({ success: true, finalised: false })
        if (approvedVotes === 2) finalStatus = 'approved'
        else if (rejectedVotes === 2) finalStatus = 'rejected'
        // Split (1-1): leave as in_review, Voland decides as tiebreaker
        else return json({ success: true, finalised: false, tiebreak: true })
      }

      if (!finalStatus) return json({ success: true, finalised: false })

      // Guard against race condition
      const { data: updated } = await supabase
        .from('submissions')
        .update({ status: finalStatus })
        .eq('id', submissionId)
        .in('status', ['pending', 'in_review'])
        .select('id, user_id, challenge_id')

      if (!updated || updated.length === 0) {
        return json({ success: true, finalised: false })
      }

      // Award rank if approved
      if (finalStatus === 'approved') {
        const sub = updated[0] as { id: string; user_id: string; challenge_id: number } | undefined
        if (sub?.user_id && sub?.challenge_id) {
          await supabase.rpc('award_rank_on_approval', {
            p_user_id: sub.user_id,
            p_challenge_id: sub.challenge_id,
          })
        }
      }

      return json({ success: true, finalised: true, finalStatus })
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    console.error('profile-action error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
