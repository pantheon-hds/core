import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { submissionId } = await req.json()

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Get submission details
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

    const gameId = submission.challenge?.game_id
    const submitterUserId = submission.user_id

    // Find eligible judges:
    // - is_judge = true
    // - has rank in this game
    // - not the submitter
    const { data: eligibleJudges } = await supabase
      .from('users')
      .select('id')
      .eq('is_judge', true)
      .neq('id', submitterUserId)
      .in('id',
        supabase
          .from('ranks')
          .select('user_id')
          .eq('game_id', gameId)
      )

    if (!eligibleJudges || eligibleJudges.length === 0) {
      console.log('No eligible judges found — falling back to admin review')
      return new Response(
        JSON.stringify({ 
          success: true, 
          judgesAssigned: 0,
          message: 'No eligible judges — admin will review manually'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Randomly select up to 3 judges
    const shuffled = eligibleJudges.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(3, shuffled.length))

    // Assign judges
    const assignments = selected.map(judge => ({
      submission_id: submissionId,
      judge_user_id: judge.id,
    }))

    const { error: assignError } = await supabase
      .from('submission_judges')
      .insert(assignments)

    if (assignError) {
      console.error('Error assigning judges:', assignError)
      return new Response(
        JSON.stringify({ error: assignError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update submission status to in_review
    await supabase
      .from('submissions')
      .update({ status: 'in_review' })
      .eq('id', submissionId)

    console.log(`Assigned ${selected.length} judges to submission ${submissionId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        judgesAssigned: selected.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
