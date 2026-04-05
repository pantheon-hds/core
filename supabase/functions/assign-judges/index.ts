import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifySessionToken } from '../_shared/adminGuard.ts'

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

  try {
    const callerId = await verifySessionToken(req)
    if (!callerId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { submissionId } = await req.json()

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    const { data: submission } = await supabase
      .from('submissions')
      .select('*, challenge:challenges(game_id), user_id')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the caller owns this submission — prevents hijacking another user's submission
    if (submission.user_id !== callerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const gameId = submission.challenge?.game_id
    const submitterUserId = submission.user_id

    // Find eligible judges: is_judge=true, has rank in this game, not the submitter
    const { data: rankedUserIds } = await supabase
      .from('ranks')
      .select('user_id')
      .eq('game_id', gameId)

    const rankedIds = (rankedUserIds || []).map((r: { user_id: string }) => r.user_id)

    if (rankedIds.length === 0) {
      console.log('No ranked users for this game — falling back to admin review')
      return new Response(
        JSON.stringify({ success: true, judgesAssigned: 0, message: 'No eligible judges — admin will review manually' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: eligibleJudgesRaw } = await supabase
      .from('users')
      .select('id')
      .eq('is_judge', true)
      .neq('id', submitterUserId)
      .in('id', rankedIds)

    const eligibleJudges = (eligibleJudgesRaw || []) as { id: string }[]

    if (eligibleJudges.length === 0) {
      console.log('No eligible judges found — falling back to admin review')
      return new Response(
        JSON.stringify({ success: true, judgesAssigned: 0, message: 'No eligible judges — admin will review manually' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Uniformly random selection of up to 3 judges
    const selected = shuffleArray(eligibleJudges).slice(0, 3)

    const { error: assignError } = await supabase
      .from('submission_judges')
      .insert(selected.map(judge => ({
        submission_id: submissionId,
        judge_user_id: judge.id,
      })))

    if (assignError) {
      console.error('Error assigning judges:', assignError)
      return new Response(
        JSON.stringify({ error: assignError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: statusError } = await supabase
      .from('submissions')
      .update({ status: 'in_review' })
      .eq('id', submissionId)

    if (statusError) {
      console.error('Error updating submission status:', statusError)
      // Judges are assigned — don't fail the whole request, just log
    }

    console.log(`Assigned ${selected.length} judges to submission ${submissionId}`)

    return new Response(
      JSON.stringify({ success: true, judgesAssigned: selected.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
